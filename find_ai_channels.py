import json
import re

def is_ai_related(text):
    # List of AI-related keywords to check
    ai_keywords = [
        r'\bai\b', r'artificial intelligence', r'\bllm\b', r'machine learning',
        r'deep learning', r'neural', r'\bgpt\b', r'\bml\b', r'chatbot',
        r'language model', r'robotics', r'automation'
    ]
    
    # Convert text to lowercase for case-insensitive matching
    text = text.lower()
    
    # Check if any of the keywords are in the text using word boundaries
    return any(re.search(keyword, text) for keyword in ai_keywords)

def find_ai_channels(filename):
    # Read the JSON file
    with open(filename, 'r') as file:
        data = json.load(file)
    
    ai_channels = []
    
    # Iterate through each channel
    for channel in data['result']['channels']:
        # Check both name and description for AI-related content
        if is_ai_related(channel['name']) or is_ai_related(channel['description']):
            ai_channels.append({
                'id': channel['id'],
                'url': channel['url'],
                'name': channel['name'],
                'description': channel['description']
            })
    
    return ai_channels

if __name__ == "__main__":
    # Assuming the JSON file is named 'channels.json'
    ai_channels = find_ai_channels('channels.json')
    
    if ai_channels:
        print("Found AI-related channels:")
        for channel in ai_channels:
            print(f"\nName: {channel['name']}")
            print(f"ID: {channel['id']}")
            print(f"URL: {channel['url']}")
            print(f"Description: {channel['description']}")
    else:
        print("No AI-related channels found.") 