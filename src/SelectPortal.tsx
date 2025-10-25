import { Link } from 'react-router-dom';
import { Card, CardBody } from './shared/components';

export default function SelectPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Samrakshak</h1>
          <p className="text-xl text-gray-600">Construction Safety Platform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/worker" className="transform transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-xl">
              <CardBody className="text-center py-12">
                <div className="text-6xl mb-4">👷</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Worker App</h2>
                <p className="text-gray-600">
                  Daily check-ins, training, job search, and safety monitoring
                </p>
              </CardBody>
            </Card>
          </Link>

          <Link to="/manager" className="transform transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-xl">
              <CardBody className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Manager Dashboard</h2>
                <p className="text-gray-600">
                  Monitor safety, track workers, manage jobs, and generate reports
                </p>
              </CardBody>
            </Card>
          </Link>

          <Link to="/contractor" className="transform transition-transform hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-xl">
              <CardBody className="text-center py-12">
                <div className="text-6xl mb-4">🏗️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Contractor Portal</h2>
                <p className="text-gray-600">
                  Post jobs and find certified construction workers
                </p>
              </CardBody>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
