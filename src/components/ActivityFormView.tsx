import React, { ChangeEvent, FocusEvent } from 'react';

/** Subset of Formik instance used by the view */
interface FormikLike {
  values: { distance: string; amount: string; activityType: string; description: string };
  errors: Partial<Record<string, string>>;
  touched: Partial<Record<string, boolean>>;
  isValid: boolean;
  handleSubmit: React.FormEventHandler<HTMLFormElement>;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

interface ActivityFormViewProps {
  category: 'transport' | 'food' | 'home';
  setCategory: (cat: 'transport' | 'food' | 'home') => void;
  formik: FormikLike;
  submitting: boolean;
  submitError: string | null;
}

const OPTIONS_MAP = {
  transport: [
    { value: 'car', label: 'Car' },
    { value: 'bus', label: 'Bus' },
    { value: 'train', label: 'Train' },
    { value: 'bicycle', label: 'Bicycle' },
    { value: 'walking', label: 'Walking' },
  ],
  food: [
    { value: 'beef', label: 'Beef' },
    { value: 'chicken', label: 'Chicken' },
    { value: 'fish', label: 'Fish' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'grains', label: 'Grains' },
  ],
  home: [
    { value: 'electricity_kwh', label: 'Electricity (kWh)' },
    { value: 'natural_gas_m3', label: 'Natural Gas (m³)' },
    { value: 'water_m3', label: 'Water (m³)' },
  ],
};

/**
 * ActivityFormView Component
 * Renders the form interface dynamically based on the selected category tab
 * @param props - Component props containing formik status and active tab state
 * @returns React component
 */
export const ActivityFormView = React.memo(function ActivityFormView({
  category,
  setCategory,
  formik,
  submitting,
  submitError,
}: ActivityFormViewProps) {
  const numFieldName = category === 'transport' ? 'distance' : 'amount';
  const numFieldLabel = category === 'transport' ? 'Distance (km)' : category === 'food' ? 'Amount (grams)' : 'Usage';
  const options = OPTIONS_MAP[category];

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="card">
      <div className="category-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['transport', 'food', 'home'] as const).map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`tab-btn ${category === cat ? 'active' : ''}`}
            style={{
              padding: '8px 12px',
              fontSize: '0.85rem',
              background: category === cat ? 'linear-gradient(135deg, var(--color-primary) 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
              color: 'white',
              border: '1px solid var(--border-color)',
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <fieldset>
        <legend className="sr-only">Log {category} activity</legend>

        <div className="form-group">
          <label htmlFor="activityType">
            {category === 'transport' ? 'Vehicle Type' : category === 'food' ? 'Food Type' : 'Resource Type'}
            <span aria-label="required">*</span>
          </label>
          <select
            id="activityType"
            name="activityType"
            value={formik.values.activityType}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-required="true"
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor={numFieldName}>
            {numFieldLabel}
            <span aria-label="required">*</span>
          </label>
          <input
            id={numFieldName}
            name={numFieldName}
            type="number"
            inputMode="decimal"
            min="0"
            step={category === 'transport' ? '0.1' : '1'}
            placeholder="0"
            value={formik.values[numFieldName]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-required="true"
          />
          {formik.touched[numFieldName] && formik.errors[numFieldName] && (
            <p className="error" role="alert">{formik.errors[numFieldName] as string}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="e.g., commute or meal log"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            maxLength={200}
          />
        </div>

        {submitError && <p className="error" role="alert">{submitError}</p>}

        <button type="submit" disabled={submitting || !formik.isValid} aria-label="Log Activity">
          {submitting ? 'Logging...' : 'Log Activity'}
        </button>
      </fieldset>
    </form>
  );
});
