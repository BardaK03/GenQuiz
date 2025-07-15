# GenQuiz - AI-Powered Quiz Generator

GenQuiz is an interactive quiz application that generates questions using AI (Ollama) and AnythingLLM. Users can select subjects and the number of questions, and the AI will generate custom quiz questions in real-time.

## Features

- ✨ **AI-Generated Questions**: Questions are generated in real-time using Ollama
- 🎯 **Subject Selection**: Choose from 12 different subjects
- 📊 **Customizable Quiz Length**: Select 1-10 questions
- 🎮 **Interactive Quiz Interface**: Navigate through questions with progress tracking
- 📈 **Results & Scoring**: Get detailed results with percentage scoring
- 🔄 **Retake Functionality**: Retake quizzes or create new ones
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS

## Setup Instructions

### Prerequisites

1. **Node.js** (version 14 or higher)
2. **Ollama** installed and running locally
3. **AnythingLLM** (optional, for enhanced AI features)

### Installation

1. **Clone and install dependencies**:

   ```bash
   cd GenQuiz-main
   npm install
   ```

2. **Set up Ollama**:

   - Install Ollama from [https://ollama.ai](https://ollama.ai)
   - Start Ollama: `ollama serve`
   - Pull a model: `ollama pull llama3.2` (or your preferred model)

3. **Configure the AI model**:

   - Edit `src/lib/ollama.ts` to change the model name if needed
   - Default model is `llama3.2`

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open the application**:
   - Navigate to `http://localhost:3000`

### Configuration

#### Ollama Settings

Edit `src/lib/ollama.ts` to customize:

- **Model**: Change the model name (e.g., `llama2`, `mistral`, `codellama`)
- **API URL**: Modify if Ollama runs on a different port
- **Temperature**: Adjust creativity level (0.0-1.0)

#### Available Models

Popular Ollama models you can use:

- `llama3.2` (default)
- `llama2`
- `mistral`
- `codellama`
- `gemma`

To switch models:

```bash
ollama pull mistral
```

Then update the model name in `src/lib/ollama.ts`.

## Usage

1. **Start a Quiz**:

   - Go to the Test page
   - Select a subject from the dropdown
   - Choose the number of questions (1-10)
   - Click "Generează testul cu AI"

2. **Take the Quiz**:

   - Answer each question by clicking on options
   - Use Previous/Next buttons to navigate
   - Click "Finish Quiz" when done

3. **View Results**:
   - See your score and percentage
   - Review correct/incorrect answers
   - Choose to retake or create a new quiz

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate-quiz/
│   │       └── route.ts          # API endpoint for quiz generation
│   ├── quiz/
│   │   └── page.tsx              # Quiz taking interface
│   ├── test/
│   │   └── page.tsx              # Quiz configuration page
│   └── ...
├── lib/
│   └── ollama.ts                 # Ollama configuration
└── components/
    └── Sidebar.tsx               # Navigation sidebar
```

## API Endpoints

### POST `/api/generate-quiz`

Generates quiz questions using Ollama.

**Request Body**:

```json
{
  "numberOfQuestions": 5,
  "subject": "Mathematics"
}
```

**Response**:

```json
{
  "success": true,
  "questions": [
    {
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Ollama Connection Error**:

   - Ensure Ollama is running: `ollama serve`
   - Check if the model is installed: `ollama list`
   - Verify the API URL in `src/lib/ollama.ts`

2. **Questions Not Generating**:

   - The app will show fallback questions if AI fails
   - Check browser console for error messages
   - Ensure the selected model is available

3. **Slow Generation**:
   - Larger models take more time
   - Consider using a smaller model like `llama2`
   - Reduce the number of questions

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Ollama** - Local AI model serving
- **AnythingLLM** - AI integration (optional)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.
