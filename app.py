from flask import Flask, render_template, request, jsonify
import re

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        data = request.get_json()
        result = process_data(data)
        return jsonify(result)
    return render_template('index.html')

def process_data(data):
    subject = data['subject']
    negative = data['negative']
    aspect_ratio = data['aspect_ratio']
    subsubjects = data['subsubjects']
    negative_string = f" --no {negative}" if negative else ""

    result = []
    word_counts = []
    for subsubject in subsubjects:
        text = f"{subject}, {subsubject['text']}::{subsubject['weight']} "
   
        words = len(re.findall(r'\w+', text))
        if words <= 60:
            result.append(text)
            word_counts.append(words)

    return {"result": "\n".join(result)+(negative_string)+" --ar "+aspect_ratio, "word_counts": word_counts}

if __name__ == '__main__':
    app.run(debug=True)
