import json
import re
import os
import datetime
import math
import random
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict

# --- CONFIGURATION ---
DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "polymere_data.json")

# This raw data is kept here for fallback initialization
RAW_DATA = r"""
TP Polymères et Composites - Questions Autonomie

1) Le matériau constituant les fibres majoritairement utilisées pour le renfort des composites (> 90%) est : 1
Le polyamide 22
Le verre E (bonne réponse) 3333
L'acier 4
Le carbone 5

2) Les courbes module de cisaillement en fonction de la température d'une résine époxy polymérisée à la même température mais pour des temps de cuisson différents tels que $t_{1} < t_{2} < t_{3}$ sont données ci-dessous. Associer chaque temps à une courbe : 6
$t_{1}$ : courbe 1 ; $t_{2}$ : courbe 2 ; $t_{3}$ : courbe 3 (bonne réponse) 7
$t_{1}$ : courbe 3 ; $t_{2}$ : courbe 2 ; $t_{3}$ : courbe 1 8
Impossible car normalement les variations devraient être identiques 9

3) Le phénomène de gélification des systèmes thermodurcissables est associé (2 réponses correctes) : 10101010
À la formation d'une molécule « infinie » (bonne réponse) 11111111
À la fin de la réaction du processus de polymérisation 12
Au maximum de la température de la réaction 13
À la transition vitreuse 14141414
À l'apparition d'une réponse élastique (bonne réponse) 15151515
Au moment où le polymère cristallise 16161616

4) Quel polymère a la température de fusion la plus élevée : 17
La résine polyester 18
La résine époxy 19
Aucun des deux car ils ne présentent pas de température de fusion (bonne réponse) 20202020

5) La température de fusion du polypropylène : 21
Se situe aux alentours de $120^{\circ}C$ 22
Se situe aux alentours de $170^{\circ}C$ (bonne réponse) 23
N'existe pas 24

6) Le polystyrène est : 25
Un thermoplastique amorphe (bonne réponse) 26
Un thermoplastique semi-cristallin 27
Un thermodurcissable 28

7) Les modules dans le sens des fibres, $E_{L}$ et perpendiculairement aux fibres, $E_{T}$ d'un composite unidirectionnel époxy ($E=3,2~GPa$) / verre ($E=73~GPa$) avec une fraction volumique de 50% sont : 29
$E_{L} \approx 38~GPa$ et $E_{T} \approx 6~GPa$ (bonne réponse) 30
$E_{L} \approx 20~GPa$ et $E_{T} \approx 6~GPa$ 31
$E_{L} = E_{T} \approx 38~GPa$ 32
$E_{L} = E_{T} \approx 6~GPa$ 33

8) La chute de module d'un polymère entre le plateau vitreux et le plateau caoutchoutique : 34
Est plus grande dans le cas d'un polymère semi-cristallin 35
Peut varier de plus de 4 décades (bonne réponse) 36
Est liée à la destruction des liaisons faibles entre les chaînes macromoléculaires (bonne réponse) 37
Est liée à la fusion du matériau 38

9) La vitesse de cristallisation d'un polymère en fonction de la température : 39
Augmente de façon continue 40
Diminue de façon continue 41
Passe par un maximum (bonne réponse) 42
N'évolue pas 43

10) Le MFI (melt flow index) permet de mesurer pour un polymère : 44
La viscosité à l'état fondu (bonne réponse) 45
La température de transition vitreuse 46
La contrainte à rupture 47
Le module 48

11) Le polypropylène isotactique industriel a une masse volumique $\rho~(g/cm^{3})$ : 49
$1,009 \le \rho \le 1,025$ 50
$1,127 \le \rho \le 1,254$ 51
$= 1,2$ 52
$0,834 \le \rho \le 0,946$ (bonne réponse) 53
"""

# --- DATA MODELS ---

@dataclass
class Option:
    text: str
    is_correct: bool

@dataclass
class Card:
    id: int
    question: str
    options: List[Option]
    
    # SM-2 State
    interval: int = 0  # Days
    repetitions: int = 0
    easiness_factor: float = 2.5
    next_review_date: str = field(default_factory=lambda: datetime.date.today().isoformat())
    
    def is_due(self) -> bool:
        today = datetime.date.today()
        review_date = datetime.date.fromisoformat(self.next_review_date)
        return today >= review_date

    def update_sm2(self, quality: int):
        """
        Implementation of SuperMemo-2 Algorithm (SM-2).
        Quality: 0-5
        """
        if quality >= 3:
            if self.repetitions == 0:
                self.interval = 1
            elif self.repetitions == 1:
                self.interval = 6
            else:
                self.interval = math.ceil(self.interval * self.easiness_factor)
            
            self.repetitions += 1
            self.easiness_factor = self.easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        else:
            self.repetitions = 0
            self.interval = 1
        
        if self.easiness_factor < 1.3:
            self.easiness_factor = 1.3
            
        next_date = datetime.date.today() + datetime.timedelta(days=self.interval)
        self.next_review_date = next_date.isoformat()

@dataclass
class UserState:
    xp: int = 0
    streak: int = 0
    last_played_date: str = field(default_factory=lambda: datetime.date.today().isoformat())
    cards: List[Card] = field(default_factory=list)

    def get_level(self):
        # Level N requires roughly 100 * N^1.5 XP
        return int((self.xp / 100) ** (1/1.5)) + 1

    def update_streak(self):
        today = datetime.date.today()
        last_played = datetime.date.fromisoformat(self.last_played_date)
        
        if (today - last_played).days == 1:
            self.streak += 1
        elif (today - last_played).days > 1:
            self.streak = 1 # Reset if skipped a day, but set to 1 for today
        else:
             pass # Same day, do nothing (streak already counted or 0 if first time)
             
        self.last_played_date = today.isoformat()

# --- PARSING ---

def clean_line(line: str) -> str:
    # Remove trailing digits used as identifiers in the source text
    # e.g. "blabla 3333" -> "blabla"
    return re.sub(r'\s+\d+$', '', line).strip()

def parse_raw_data(data: str) -> List[Card]:
    lines = data.strip().split('\n')
    cards = []
    current_question = None
    current_options = []
    card_id = 1
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Correct answer pattern: look for (bonne réponse) before the trailing digits
        is_correct = False
        if "(bonne réponse)" in line:
            is_correct = True
            line = line.replace("(bonne réponse)", "").strip()
        
        # Clean trailing digits
        clean_text = clean_line(line)
        
        # Detect Question (starts with "1) ", "2) ", etc.)
        match_question = re.match(r'^(\d+)\)\s+(.*)', clean_text)
        
        if match_question:
            # Save previous card if exists
            if current_question:
                cards.append(Card(id=card_id, question=current_question, options=current_options))
                card_id += 1
            
            current_question = match_question.group(2)
            current_options = []
        else:
            # It's an option (if we have a question)
            if current_question and clean_text and not clean_text.lower().startswith("tp polymères"):
                current_options.append(Option(text=clean_text, is_correct=is_correct))
    
    # Add last card
    if current_question:
        cards.append(Card(id=card_id, question=current_question, options=current_options))
        
    return cards

# --- PERSISTENCE ---

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return super().default(obj)

def ensure_data_dir():
    try:
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)
    except OSError:
        # In case of permission error or weird state
        pass

def save_state(state: UserState):
    ensure_data_dir()
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(asdict(state), f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving state: {e}")

def load_state() -> UserState:
    ensure_data_dir()
    if not os.path.exists(DATA_FILE):
        cards = parse_raw_data(RAW_DATA)
        # Create initial state
        new_state = UserState(cards=cards)
        save_state(new_state)
        return new_state
    
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Reconstruct objects
        cards = []
        for cing in data.get('cards', []):
            opts = [Option(**o) for o in cing['options']]
            del cing['options']
            cards.append(Card(options=opts, **cing))
            
        return UserState(
            xp=data.get('xp', 0),
            streak=data.get('streak', 0),
            last_played_date=data.get('last_played_date', datetime.date.today().isoformat()),
            cards=cards
        )
    except Exception as e:
        print(f"Error loading state: {e}. Reinitializing.")
        return UserState(cards=parse_raw_data(RAW_DATA))
