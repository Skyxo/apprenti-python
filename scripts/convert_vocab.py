
import csv
import sys
import collections

def transform_csv(input_file, output_file):
    # Dictionary to store aggregated data
    # Key: (Word, Translation, Definition)
    # Value: List of Examples
    data = collections.defaultdict(list)
    
    # Read input CSV
    # Assuming semicolon delimiter as per user's current format
    with open(input_file, 'r', encoding='utf-8') as f:
        # Use csv.reader to handle quoting correctly if present
        reader = csv.reader(f, delimiter=';')
        
        # Read header
        try:
            header = next(reader)
        except StopIteration:
            print("Empty file")
            return

        # Indices (assuming order: Word;French Translation;English Definition;Example Sentence)
        # But let's try to find indices dynamically or assume fixed structure if header matches
        # The user provided header: Word;French Translation;English Definition;Example Sentence
        
        for row in reader:
            if not row or len(row) < 4:
                continue
                
            word = row[0].strip()
            translation = row[1].strip()
            definition = row[2].strip()
            example = row[3].strip()
            
            key = (word, translation, definition)
            if example:
                data[key].append(example)

    # Determine max number of examples
    max_examples = 0
    if data:
        max_examples = max(len(exs) for exs in data.values())
    
    # Generate new header
    new_header = ['Word', 'French Translation', 'English Definition']
    if max_examples == 0:
        new_header.append('Example Sentence')
    else:
        new_header.append('Example Sentence') # First one
        for i in range(2, max_examples + 1):
            new_header.append(f'Example {i}')
            
    # Write output CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter=';')
        writer.writerow(new_header)
        
        for (word, trans, defi), examples in data.items():
            row = [word, trans, defi]
            
            # Fill examples
            for i in range(max_examples):
                if i < len(examples):
                    row.append(examples[i])
                else:
                    row.append('') # Empty filler
            
            writer.writerow(row)

    print(f"Successfully converted {input_file} to {output_file}")
    print(f"Total vocabulary items: {len(data)}")
    print(f"Max examples found: {max_examples}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python convert_vocab.py <input_csv> <output_csv>")
    else:
        transform_csv(sys.argv[1], sys.argv[2])
