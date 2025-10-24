import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button } from '../../../shared/components';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_num: number;
  questions: any;
}

interface Progress {
  lesson_id: string;
  completed: boolean;
  quiz_score: number | null;
}

export default function Training() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get worker profile
      const { data: workerProfile } = await supabase
        .from('worker_profiles')
        .select('id, is_certified')
        .eq('user_id', user.id)
        .single();

      if (workerProfile) {
        setWorkerId(workerProfile.id);
        setHasCertificate(workerProfile.is_certified);
      }

      // Get lessons
      const { data: lessonsData } = await supabase
        .from('training_lessons')
        .select('*')
        .order('order_num');

      if (lessonsData) {
        setLessons(lessonsData);
      }

      // Get progress
      if (workerProfile) {
        const { data: progressData } = await supabase
          .from('training_progress')
          .select('*')
          .eq('worker_id', workerProfile.id);

        if (progressData) {
          setProgress(progressData);
        }
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getLessonProgress = (lessonId: string) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  const completedCount = progress.filter(p => p.completed).length;
  const allCompleted = lessons.length > 0 && completedCount === lessons.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/worker/home')} className="text-2xl">
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Safety Training</h1>
            <p className="text-xs text-gray-600">
              {completedCount} of {lessons.length} lessons completed
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Progress Card */}
        <Card className={allCompleted ? 'bg-green-50 border-2 border-green-500' : ''}>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {allCompleted ? '🎓' : '📚'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {allCompleted ? 'Certified!' : 'Safety Certification'}
                </h2>
                {allCompleted ? (
                  <p className="text-sm text-green-700 mt-1">
                    You've completed all training modules
                  </p>
                ) : (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(completedCount / lessons.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Complete all lessons to get certified
                    </p>
                  </>
                )}
              </div>
              {allCompleted && !hasCertificate && (
                <Button
                  onClick={async () => {
                    // Generate certificate
                    try {
                      const certUrl = `https://example.com/certificates/${workerId}.pdf`;

                      await supabase.from('certifications').insert({
                        worker_id: workerId,
                        certificate_url: certUrl,
                      });

                      await supabase
                        .from('worker_profiles')
                        .update({ is_certified: true })
                        .eq('id', workerId);

                      setHasCertificate(true);
                    } catch (error) {
                      console.error('Error generating certificate:', error);
                    }
                  }}
                >
                  Get Certificate
                </Button>
              )}
              {hasCertificate && (
                <Button variant="secondary">
                  View Certificate
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Lessons */}
        {lessons.map((lesson, index) => {
          const lessonProgress = getLessonProgress(lesson.id);
          const isCompleted = lessonProgress?.completed || false;
          const score = lessonProgress?.quiz_score;

          return (
            <Link key={lesson.id} to={`/worker/training/${lesson.id}`}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {isCompleted ? '✅' : '📖'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">
                            Lesson {index + 1}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {lesson.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {lesson.description}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500 ml-4">
                          {lesson.duration_minutes} min
                        </div>
                      </div>

                      {isCompleted && score !== null && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="text-sm font-medium text-green-600">
                            Completed • Score: {score}/3
                          </div>
                        </div>
                      )}

                      {!isCompleted && (
                        <div className="mt-3">
                          <Button size="sm">
                            Start Lesson →
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
