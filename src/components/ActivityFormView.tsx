import React, { ChangeEvent, FocusEvent, useId } from 'react';

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

const CATEGORIES = ['transport', 'food', 'home'] as const;

const OPTIONS_MAP: Record<typeof CATEGORIES[number], { value: string; label: string }[]> = {
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

const LABEL_MAP: Record<typeof CATEGORIES[number], string> = {
  transport: 'Vehicle Type',
  food: 'Food Type',
  home: 'Resource Type',
};

const NUM_LABEL_MAP: Record<typeof CATEGORIES[number], string> = {
  transport: 'Distance (km)',
  food: 'Amount (grams)',
  home: 'Usage (kWh / m³)',
};

/**
 * ActivityFormView Component
 * Renders the accessible form interface with ARIA tab navigation for category selection.
 * Delegates all state management to the parent ActivityForm container.
 * @param props - Category, formik instance, submit state, and error
 * @returns Memoised React form element
 */
export const ActivityFormView = React.memo(function ActivityFormView({
  category,
  setCategory,
  formik,
  submitting,
  submitError,
}: ActivityFormViewProps) {
  const tablistId = useId();
  const panelId = useId();
  const numFieldName = category === 'transport' ? 'distance' : 'amount';
  const numFieldLabel = NUM_LABEL_MAP[category];
  const activityTypeLabel = LABEL_MAP[category];
  const options = OPTIONS_MAP[category];
  const numError = formik.touched[numFieldName] && formik.errors[numFieldName]
    ? (formik.errors[numFieldName] as string)
    : null;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="card" aria-label="Log carbon activity">
      {/* Accessible tab list for category selection */}
      <div
        role="tablist"
        aria-label="Activity category"
        id={tablistId}
        style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}
      >
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            id={`${tablistId}-tab-${cat}`}
            role="tab"
            type="button"
            aria-selected={category === cat}
            aria-controls={panelId}
            onClick={() => setCategory(cat)}
            className={`tab-btn ${category === cat ? 'active' : ''}`}
            style={{
              padding: '8px 12px',
              fontSize: '0.85rem',
              background: category === cat
                ? 'linear-gradient(135deg, var(--color-primary) 0%, #059669 100%)'
                : 'rgba(255,255,255,0.05)',
              color: 'white',
              border: `1px solid ${category === cat ? 'var(--color-primary)' : 'var(--border-color)'}`,
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={`${tablistId}-tab-${category}`}
      >
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Log {category} activity</legend>

          <div className="form-group">
            <label htmlFor="activityType">
              {activityTypeLabel}
              <span aria-hidden="true" style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>
            </label>
            <select
              id="activityType"
              name="activityType"
              value={formik.values.activityType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-required="true"
              aria-label={activityTypeLabel}
            >
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor={numFieldName}>
              {numFieldLabel}
              <span aria-hidden="true" style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>
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
              aria-invalid={numError ? 'true' : 'false'}
              aria-describedby={numError ? `${numFieldName}-error` : undefined}
            />
            {numError && (
              <p id={`${numFieldName}-error`} className="error" role="alert" aria-live="polite">
                {numError}
              </p>
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

          {submitError && (
            <p className="error" role="alert" aria-live="assertive">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !formik.isValid}
            aria-label="Log Activity"
            aria-busy={submitting}
          >
            {submitting ? 'Logging...' : 'Log Activity'}
          </button>
        </fieldset>
      </div>
    </form>
  );
});
