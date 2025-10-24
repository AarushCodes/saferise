import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Button, Card, CardBody } from '../../../shared/components';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

export default function LessonDetail() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [workerId, setWorkerId] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  async function loadLesson() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workerProfile } = await supabase
        .from('worker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (workerProfile) {
        setWorkerId(workerProfile.id);
      }

      const { data } = await supabase
        .from('training_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (data) {
        setLesson(data);
        setAnswers(new Array(data.questions.length).fill(-1));
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(questionIndex: number, optionIndex: number) {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  }

  async function submitQuiz() {
    const questions: Question[] = lesson.questions;
    let correctCount = 0;

    questions.forEach((q, i) => {
      if (answers[i] === q.correct) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);

    // Save progress
    try {
      await supabase.from('training_progress').upsert({
        worker_id: workerId,
        lesson_id: lessonId,
        completed: true,
        quiz_score: correctCount,
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Lesson not found</div>
      </div>
    );
  }

  const questions: Question[] = lesson.questions;
  const allAnswered = answers.every(a => a !== -1);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/worker/training')} className="text-2xl">
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
            <p className="text-xs text-gray-600">{lesson.duration_minutes} minutes</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {!showQuiz ? (
          <>
            {/* Video Section */}
            <Card>
              <CardBody>
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                  <video
                    controls
                    className="w-full h-full"
                    poster="https://via.placeholder.com/800x450/1f2937/ffffff?text=Training+Video"
                  >
                    <source src={lesson.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {lesson.title}
                </h2>
                <p className="text-gray-600">{lesson.description}</p>
              </CardBody>
            </Card>

            {/* Take Quiz Button */}
            <Card>
              <CardBody>
                <div className="text-center py-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Ready for the quiz?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Answer 3 questions to complete this lesson
                  </p>
                  <Button size="lg" onClick={() => setShowQuiz(true)}>
                    Start Quiz →
                  </Button>
                </div>
              </CardBody>
            </Card>
          </>
        ) : (
          <>
            {/* Quiz Section */}
            <Card>
              <CardBody>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Time!</h2>

                <div className="space-y-8">
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="border-b pb-6 last:border-b-0">
                      <div className="font-semibold text-gray-900 mb-4">
                        {qIndex + 1}. {q.question}
                      </div>
                      <div className="space-y-2">
                        {q.options.map((option, oIndex) => {
                          const isSelected = answers[qIndex] === oIndex;
                          const isCorrect = q.correct === oIndex;
                          const showResult = submitted;

                          let className = 'p-4 border-2 rounded-lg cursor-pointer transition-all ';

                          if (showResult) {
                            if (isCorrect) {
                              className += 'border-green-500 bg-green-50';
                            } else if (isSelected && !isCorrect) {
                              className += 'border-red-500 bg-red-50';
                            } else {
                              className += 'border-gray-200';
                            }
                          } else {
                            if (isSelected) {
                              className += 'border-blue-500 bg-blue-50';
                            } else {
                              className += 'border-gray-200 hover:border-blue-300';
                            }
                          }

                          return (
                            <button
                              key={oIndex}
                              type="button"
                              onClick={() => !submitted && handleAnswer(qIndex, oIndex)}
                              disabled={submitted}
                              className={className}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 border-2 rounded-full flex items-center justify-center flex-shrink-0">
                                  {isSelected && (
                                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                  )}
                                </div>
                                <span className="text-left">{option}</span>
                                {showResult && isCorrect && (
                                  <span className="ml-auto text-green-600 font-bold">✓</span>
                                )}
                                {showResult && isSelected && !isCorrect && (
                                  <span className="ml-auto text-red-600 font-bold">✗</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Submit/Results */}
            {!submitted ? (
              <Button
                size="lg"
                className="w-full"
                onClick={submitQuiz}
                disabled={!allAnswered}
              >
                Submit Answers
              </Button>
            ) : (
              <Card className={score === questions.length ? 'bg-green-50 border-2 border-green-500' : 'bg-yellow-50 border-2 border-yellow-500'}>
                <CardBody>
                  <div className="text-center py-6">
                    <div className="text-6xl mb-4">
                      {score === questions.length ? '🎉' : '📝'}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Score: {score}/{questions.length}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {score === questions.length
                        ? 'Perfect! Lesson completed.'
                        : `You got ${score} out of ${questions.length} correct.`}
                    </p>
                    <Button
                      size="lg"
                      onClick={() => navigate('/worker/training')}
                    >
                      Back to Training
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
