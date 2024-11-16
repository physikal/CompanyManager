import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  formatShortDate, 
  hoursAndMinutesToMinutes,
  minutesToHoursAndMinutes,
  isValidTimeFormat,
} from '@/utils/time';
import type { TimeEntry } from '@/types';

interface WeeklyViewProps {
  weekDays: Date[];
  existingEntries: TimeEntry[];
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface WeeklyEntryFormData {
  entries: {
    projectId: string;
    hours: {
      [key: string]: {
        duration: string;
        description: string;
      };
    };
  }[];
}

export function WeeklyView({ weekDays, existingEntries, onSuccess, onError }: WeeklyViewProps) {
  const { user } = useAuth();
  const { company } = useCompany();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([0]);

  // Group existing entries by project
  const entriesByProject = existingEntries.reduce((acc, entry) => {
    if (!acc[entry.projectId]) {
      acc[entry.projectId] = [];
    }
    acc[entry.projectId].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  // Initialize form with existing entries
  const defaultValues: WeeklyEntryFormData = {
    entries: Object.keys(entriesByProject).length > 0 
      ? Object.entries(entriesByProject).map(([projectId, entries]) => ({
          projectId,
          hours: weekDays.reduce((acc, day) => {
            const dateKey = day.toISOString().split('T')[0];
            const entry = entries.find(e => 
              e.date.toISOString().split('T')[0] === dateKey
            );
            acc[dateKey] = {
              duration: entry ? minutesToHoursAndMinutes(entry.duration) : '',
              description: entry?.description || '',
            };
            return acc;
          }, {} as { [key: string]: { duration: string; description: string } }),
        }))
      : [{
          projectId: '',
          hours: weekDays.reduce((acc, day) => {
            const dateKey = day.toISOString().split('T')[0];
            acc[dateKey] = { duration: '', description: '' };
            return acc;
          }, {} as { [key: string]: { duration: string; description: string } }),
        }],
  };

  const { control, handleSubmit, reset } = useForm<WeeklyEntryFormData>({
    defaultValues,
  });

  // Reset form when existingEntries changes
  useEffect(() => {
    reset(defaultValues);
  }, [existingEntries]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries',
  });

  const toggleRow = (index: number) => {
    setExpandedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const onSubmit = async (data: WeeklyEntryFormData) => {
    if (!user || !company) {
      onError('Company information not found');
      return;
    }

    setLoading(true);

    try {
      const timeEntriesRef = collection(db, 'timeEntries');
      const entries = data.entries.flatMap(entry => {
        if (!entry.projectId) return [];

        return Object.entries(entry.hours)
          .filter(([_, { duration }]) => duration && isValidTimeFormat(duration))
          .map(([date, { duration, description }]) => ({
            userId: user.uid,
            companyId: company.id,
            projectId: entry.projectId,
            date: new Date(date),
            duration: hoursAndMinutesToMinutes(duration),
            description: description || '',
            status: 'draft',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.uid,
            updatedBy: user.uid,
          }));
      });

      if (entries.length === 0) {
        onError('No valid time entries to save');
        return;
      }

      const savePromises = entries.map(entry => addDoc(timeEntriesRef, entry));
      await Promise.all(savePromises);
      onSuccess();
    } catch (err) {
      console.error('Error saving time entries:', err);
      onError('Failed to save time entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
              <div className="flex-1">
                <Controller
                  control={control}
                  name={`entries.${index}.projectId`}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <div className="flex items-center ml-4 space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRow(index)}
                >
                  {expandedRows.includes(index) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {expandedRows.includes(index) && (
              <div className="p-4">
                <div className="grid grid-cols-7 gap-4">
                  {weekDays.map((day) => {
                    const dateKey = day.toISOString().split('T')[0];
                    return (
                      <div key={dateKey} className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          {formatShortDate(day)}
                        </div>
                        <Controller
                          control={control}
                          name={`entries.${index}.hours.${dateKey}.duration`}
                          render={({ field }) => (
                            <input
                              type="text"
                              {...field}
                              placeholder="HH:MM"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name={`entries.${index}.hours.${dateKey}.description`}
                          render={({ field }) => (
                            <textarea
                              {...field}
                              rows={3}
                              placeholder="Description"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button
          type="button"
          onClick={() => {
            append({
              projectId: '',
              hours: weekDays.reduce((acc, day) => {
                const dateKey = day.toISOString().split('T')[0];
                acc[dateKey] = { duration: '', description: '' };
                return acc;
              }, {}),
            });
            setExpandedRows((prev) => [...prev, fields.length]);
          }}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Project Line
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save All Entries'}
        </Button>
      </div>
    </form>
  );
}