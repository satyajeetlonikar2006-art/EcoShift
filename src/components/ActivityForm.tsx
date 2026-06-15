import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Activity, VehicleType } from '@/types';
import { calculateTransportEmissions } from '@/services/carbonCalculator';
import { logActivity } from '@/services/firebaseDB';
import { trackActivityLogged } from '@/services/googleAnalytics';
import { useState } from 'react';

const validationSchema = Yup.object({
  distance: Yup.number()
    .positive('Distance must be greater than 0')
    .max(500, 'Distance cannot exceed 500 km')
    .required('Distance is required'),
  vehicleType: Yup.string()
    .oneOf(
      Object.values(VehicleType),
      'Invalid vehicle type'
    )
    .required('Vehicle type is required'),
  description: Yup.string().max(200, 'Description too long').optional(),
});

interface ActivityFormProps {
  onActivityLogged?: (activity: Activity) => void;
}

export function ActivityForm({ onActivityLogged }: ActivityFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      distance: '',
      vehicleType: VehicleType.CAR,
      description: '',
    },
    validationSchema,
    onSubmit: async values => {
      setSubmitting(true);
      setSubmitError(null);

      try {
        const co2 = calculateTransportEmissions(
          parseFloat(values.distance),
          values.vehicleType
        );

        const activity = await logActivity({
          category: 'transport',
          activityType: values.vehicleType,
          distance: parseFloat(values.distance),
          co2Impact: co2,
          description: values.description || '',
          date: new Date(),
        });

        // Track in Google Analytics
        trackActivityLogged(values.vehicleType, co2);

        // Reset form
        formik.resetForm();
        onActivityLogged?.(activity);
      } catch (error) {
        console.error('Failed to log activity:', error);
        setSubmitError(
          error instanceof Error ? error.message : 'Failed to log activity'
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="card">
      <fieldset>
        <legend>Log Your Carbon Activity</legend>

        <div className="form-group">
          <label htmlFor="vehicleType">
            Vehicle Type
            <span aria-label="required">*</span>
          </label>
          <select
            id="vehicleType"
            name="vehicleType"
            value={formik.values.vehicleType}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-required="true"
            aria-describedby={formik.touched.vehicleType && formik.errors.vehicleType ? 'vehicleType-error' : undefined}
          >
            <option value={VehicleType.CAR}>Car</option>
            <option value={VehicleType.BUS}>Bus</option>
            <option value={VehicleType.TRAIN}>Train</option>
            <option value={VehicleType.BICYCLE}>Bicycle</option>
            <option value={VehicleType.WALKING}>Walking</option>
          </select>
          {formik.touched.vehicleType && formik.errors.vehicleType && (
            <p id="vehicleType-error" className="error" role="alert">
              {formik.errors.vehicleType}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="distance">
            Distance (km)
            <span aria-label="required">*</span>
          </label>
          <input
            id="distance"
            name="distance"
            type="number"
            inputMode="decimal"
            min="0"
            max="500"
            step="0.1"
            placeholder="0"
            value={formik.values.distance}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-required="true"
            aria-describedby={formik.touched.distance && formik.errors.distance ? 'distance-error' : 'distance-help'}
          />
          <p id="distance-help" className="help-text">
            Enter the distance traveled in kilometers
          </p>
          {formik.touched.distance && formik.errors.distance && (
            <p id="distance-error" className="error" role="alert">
              {formik.errors.distance}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description (optional)
          </label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="e.g., Commute to work"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            maxLength={200}
            aria-describedby="description-help"
          />
          <p id="description-help" className="help-text">
            {formik.values.description.length}/200 characters
          </p>
        </div>

        {submitError && (
          <p className="error" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !formik.isValid}
          aria-label="Log Activity"
        >
          {submitting ? 'Logging...' : 'Log Activity'}
        </button>
      </fieldset>
    </form>
  );
}
