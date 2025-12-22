import streamlit as st
import datetime
import time
import backend

# --- CONFIGURATION & CSS ---
st.set_page_config(
    page_title="Anki Polymères",
    page_icon="🧬",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Custom CSS for "Medical/Scientific" aesthetic
st.markdown("""
<style>
    .stApp {
        background-color: #f0f2f6; 
    }
    .main-card {
        background-color: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
    }
    .stat-box {
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stat-value {
        font-size: 1.5rem;
        font-weight: bold;
        color: #2c3e50;
    }
    .stat-label {
        font-size: 0.8rem;
        color: #7f8c8d;
    }
    .success-msg {
        color: #27ae60;
        font-weight: bold;
        font-size: 1.2rem;
    }
    .error-msg {
        color: #c0392b;
        font-weight: bold;
        font-size: 1.2rem;
    }
    div.stButton > button {
        width: 100%;
        border-radius: 8px;
        height: 3rem;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# --- STATE MANAGEMENT ---
if 'user_state' not in st.session_state:
    st.session_state.user_state = backend.load_state()

if 'current_card' not in st.session_state:
    st.session_state.current_card = None

if 'feedback' not in st.session_state:
    st.session_state.feedback = None # (is_correct, message, correct_answer_str)

if 'start_time' not in st.session_state:
    st.session_state.start_time = None

# --- HELPER FUNCTIONS ---
def get_due_cards():
    return [c for c in st.session_state.user_state.cards if c.is_due()]

def next_card():
    due = get_due_cards()
    if due:
        # Pick random or first? Let's just shuffle in backend but here just take first for stability
        import random
        st.session_state.current_card = random.choice(due)
        st.session_state.start_time = datetime.datetime.now()
        st.session_state.feedback = None
    else:
        st.session_state.current_card = None

def submit_answer(selected_indices):
    card = st.session_state.current_card
    if not card:
        return

    end_time = datetime.datetime.now()
    duration = (end_time - st.session_state.start_time).seconds
    
    # Verify answer
    correct_indices = [i for i, opt in enumerate(card.options) if opt.is_correct]
    correct_indices.sort()
    selected_indices.sort()
    
    is_correct = (selected_indices == correct_indices)
    
    if is_correct:
        # XP Calculation
        speed_bonus = max(0, 5 - duration)
        xp_gain = 10 + speed_bonus
        st.session_state.user_state.xp += xp_gain
        st.session_state.user_state.update_streak()
        
        # SM-2 Update
        quality = 3
        if duration < 5: quality = 5
        elif duration < 15: quality = 4
        
        card.update_sm2(quality) # In-memory update
        
        st.session_state.feedback = (True, f"Correct ! +{xp_gain} XP", None)
        st.balloons()
    else:
        card.update_sm2(0)
        correct_letters = ", ".join([chr(65+i) for i in correct_indices])
        st.session_state.feedback = (False, "Incorrect...", correct_letters)

    # Save immediately
    backend.save_state(st.session_state.user_state)

# --- UI LAYOUT ---

# Top Stats Bar
col1, col2, col3 = st.columns(3)
level = st.session_state.user_state.get_level()
xp = st.session_state.user_state.xp
streak = st.session_state.user_state.streak

with col1:
    st.markdown(f"""<div class="stat-box"><div class="stat-value">{level}</div><div class="stat-label">Niveau</div></div>""", unsafe_allow_html=True)
with col2:
    st.markdown(f"""<div class="stat-box"><div class="stat-value">{xp}</div><div class="stat-label">XP Total</div></div>""", unsafe_allow_html=True)
with col3:
    st.markdown(f"""<div class="stat-box"><div class="stat-value">{streak} 🔥</div><div class="stat-label">Série (Jours)</div></div>""", unsafe_allow_html=True)

st.divider()

# Main Area
if st.session_state.current_card is None:
    # Check if we need to load a card
    due_cards = get_due_cards()
    if due_cards:
        if st.button("Démarrer la révision", type="primary"):
            next_card()
            st.rerun()
    else:
        st.markdown("""
        <div class="main-card" style="text-align: center;">
            <h2>🎉 Tout est à jour !</h2>
            <p>Vous avez révisé toutes vos cartes pour aujourd'hui.</p>
            <p>Revenez demain pour garder votre série !</p>
        </div>
        """, unsafe_allow_html=True)
else:
    # SHOW QUESTION
    card = st.session_state.current_card
    
    st.markdown(f"""
    <div class="main-card">
        <h3>Question {card.id}</h3>
        <p style="font-size: 1.1rem;">{card.question}</p>
    </div>
    """, unsafe_allow_html=True)

    # SHOW FEEDBACK IF ANSWERED
    if st.session_state.feedback:
        is_success, msg, correct_str = st.session_state.feedback
        
        if is_success:
            st.markdown(f'<div class="main-card" style="background-color: #d4edda; border: 1px solid #c3e6cb;">'
                        f'<p class="success-msg">✅ {msg}</p></div>', unsafe_allow_html=True)
        else:
             st.markdown(f'<div class="main-card" style="background-color: #f8d7da; border: 1px solid #f5c6cb;">'
                        f'<p class="error-msg">❌ {msg}</p>'
                        f'<p>La bonne réponse était : <b>{correct_str}</b></p></div>', unsafe_allow_html=True)
        
        if st.button("Question suivante ➡", type="primary"):
            next_card()
            st.rerun()
            
    else:
        # SHOW OPTIONS FORM
        with st.form("answer_form"):
            user_choices = []
            
            # Use checkboxes for multi-select feel, but check logic later
            # Or use radio if single choice strictly, but data suggests multi answers possible
            # The data logic supports multiple correct answers, so checkboxes are safer UI
            
            st.write("Votre réponse :")
            
            # To preserve state of checkboxes inside form correctly, keys needed
            selections = {}
            for idx, opt in enumerate(card.options):
                letter = chr(65 + idx)
                selections[idx] = st.checkbox(f"{letter}) {opt.text}", key=f"q_{card.id}_opt_{idx}")
            
            submitted = st.form_submit_button("Valider")
            
            if submitted:
                selected_indices = [idx for idx, selected in selections.items() if selected]
                if not selected_indices:
                    st.warning("Veuillez sélectionner au moins une réponse.")
                else:
                    submit_answer(selected_indices)
                    st.rerun()
