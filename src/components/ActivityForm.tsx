import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Activity } from '@/types';
import { calculateTransportEmissions, calculateFoodEmissions, calculateHomeEmissions } from '@/services/carbonCalculator';
import { logActivity } from '@/services/firebaseDB';
import { trackActivityLogged } from '@/services/googleAnalytics';
import { useState, useMemo } from 'react';
import { ActivityFormView } from './ActivityFormView';

const DESC_LIMIT = 200;
const DIST_LIMIT = 500;
const FOOD_LIMIT = 5000;
const HOME_LIMIT = 2000;

const schemas = {
  transport: Yup.object({
    distance: Yup.number().positive('Distance must be > 0').max(DIST_LIMIT, 'Max 500 km').required('Required'),
    activityType: Yup.string().required('Required'),
    description: Yup.string().max(DESC_LIMIT).optional()
  }),
  food: Yup.object({
    amount: Yup.number().positive('Amount must be > 0').max(FOOD_LIMIT, 'Max 5000g').required('Required'),
    activityType: Yup.string().required('Required'),
    description: Yup.string().max(DESC_LIMIT).optional()
  }),
  home: Yup.object({
    amount: Yup.number().positive('Usage must be > 0').max(HOME_LIMIT, 'Max 2000').required('Required'),
    activityType: Yup.string().required('Required'),
    description: Yup.string().max(DESC_LIMIT).optional()
  })
};

interface ActivityFormProps {
  onActivityLogged?: (activity: Activity) => void;
}

/**
 * ActivityForm Component (Container)
 * Manages form state, active category tab, validation schema, and activity logging logic
 * @param props - Component props containing logged callback
 * @returns React component
 */
export function ActivityForm({ onActivityLogged }: ActivityFormProps) {
  const [category, setCategory] = useState<'transport' | 'food' | 'home'>('transport');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeSchema = useMemo(() => schemas[category], [category]);

  const formik = useFormik({
    initialValues: { distance: '', amount: '', activityType: 'car', description: '' },
    validationSchema: activeSchema,
    onSubmit: async values => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const co2 = category === 'transport'
          ? calculateTransportEmissions(parseFloat(values.distance), values.activityType)
          : category === 'food'
          ? calculateFoodEmissions(parseFloat(values.amount), values.activityType)
          : calculateHomeEmissions(parseFloat(values.amount), values.activityType);

        const activity = await logActivity({
          category,
          activityType: values.activityType,
          distance: category === 'transport' ? parseFloat(values.distance) : undefined,
          amount: category !== 'transport' ? parseFloat(values.amount) : undefined,
          co2Impact: co2,
          description: values.description || '',
          date: new Date()
        });

        trackActivityLogged(values.activityType, co2);
        formik.resetForm({
          values: {
            distance: '',
            amount: '',
            activityType: category === 'transport' ? 'car' : category === 'food' ? 'beef' : 'electricity_kwh',
            description: ''
          }
        });
        onActivityLogged?.(activity);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to log activity');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleCategoryChange = (cat: 'transport' | 'food' | 'home') => {
    setCategory(cat);
    formik.resetForm({
      values: {
        distance: '',
        amount: '',
        activityType: cat === 'transport' ? 'car' : cat === 'food' ? 'beef' : 'electricity_kwh',
        description: ''
      }
    });
  };

  return (
    <ActivityFormView
      category={category}
      setCategory={handleCategoryChange}
      formik={formik}
      submitting={submitting}
      submitError={submitError}
    />
  );
}
