interface ObservationSegmentedTabsProps<T extends string> {
  tabs: Array<{
    key: T;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  value: T;
  onChange: (value: T) => void;
}

export default function ObservationSegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: ObservationSegmentedTabsProps<T>) {
  return (
    <div className="observation-segmented-tabs" role="tablist">
      {tabs.map((tab) => {
        const active = tab.key === value;

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            className={`observation-segmented-tab${active ? " observation-segmented-tab--active" : ""}`}
            onClick={() => onChange(tab.key)}
          >
            <span className="observation-segmented-tab-label">{tab.label}</span>
            {tab.description && <span className="observation-segmented-tab-copy">{tab.description}</span>}
          </button>
        );
      })}
    </div>
  );
}
