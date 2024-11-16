import { useState, useEffect } from 'react';

export function usePayPeriod() {
  const [currentPeriod, setCurrentPeriod] = useState<{
    startDate: Date;
    endDate: Date;
  }>({ startDate: new Date(), endDate: new Date() });

  useEffect(() => {
    const calculatePayPeriod = () => {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      let startDate: Date;
      let endDate: Date;

      if (currentDay < 15) {
        // First period of the month (1st-14th)
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth, 14, 23, 59, 59);
      } else {
        // Second period of the month (15th-end)
        startDate = new Date(currentYear, currentMonth, 15);
        endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      }

      setCurrentPeriod({ startDate, endDate });
    };

    calculatePayPeriod();
  }, []);

  const isDateInCurrentPeriod = (date: Date) => {
    return (
      date >= currentPeriod.startDate && 
      date <= currentPeriod.endDate
    );
  };

  return {
    currentPeriod,
    isDateInCurrentPeriod,
  };
}