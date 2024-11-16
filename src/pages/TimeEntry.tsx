import { useState } from 'react';
import { addDays, subDays, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { WeeklyView } from '@/components/time-entry/WeeklyView';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { usePayPeriod } from '@/hooks/usePayPeriod';
import { getWeekDays, formatDate } from '@/utils/time';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function TimeEntry() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const weekDays = getWeekDays(currentDate);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[weekDays.length - 1];
  
  const { entries, loading: entriesLoading } = useTimeEntries(weekStart, weekEnd);
  const { currentPeriod } = usePayPeriod();

  const handlePreviousWeek = () => {
    setCurrentDate(prevDate => subDays(prevDate, 7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };

  const handleSuccess = () => {
    setSuccess('Time entries saved successfully');
    setError('');
  };

  const handleError = (message: string) => {
    setError(message);
    setSuccess('');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Time Entry</h1>
            <p className="mt-1 text-sm text-gray-600">
              Pay Period: {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handlePreviousWeek}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Week
            </Button>
            <Button
              variant="outline"
              onClick={handleNextWeek}
              className="flex items-center"
            >
              Next Week
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {entriesLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <WeeklyView
                weekDays={weekDays}
                existingEntries={entries}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}