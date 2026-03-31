import type { TabGroup } from '../types'

export const FDA_FOOD_GROUP: TabGroup = {
  id: 'food',
  label: 'Food & CAERS',
  icon: 'Apple',
  tabs: [
    {
      id: 'food-recalls',
      label: 'Food Recalls',
      description: 'FDA food product recall enforcement actions',
      mcpTool: 'openfda_food_recalls',
      defaultParams: { limit: 25, skip: 0 },
      primaryKey: 'recall_number',
      titleField: 'recall_number',
      dateField: 'recall_initiation_date',
      detailView: 'drawer',
      badgeConfig: {
        field: 'classification',
        variants: {
          'Class I': { label: 'Class I', variant: 'destructive' },
          'Class II': { label: 'Class II', variant: 'default' },
          'Class III': { label: 'Class III', variant: 'secondary' },
        },
      },
      columns: [
        { field: 'recall_number', header: 'Recall #', width: 'w-36', render: 'text', sortable: true, defaultVisible: true },
        { field: 'classification', header: 'Class', width: 'w-24', render: 'badge', sortable: true, defaultVisible: true },
        { field: 'recalling_firm', header: 'Recalling Firm', render: 'truncate', defaultVisible: true },
        { field: 'reason_for_recall', header: 'Reason', render: 'truncate', defaultVisible: true },
        { field: 'distribution_pattern', header: 'Distribution', render: 'truncate', defaultVisible: true },
        { field: 'recall_initiation_date', header: 'Initiated', width: 'w-32', render: 'date', sortable: true, defaultVisible: false },
      ],
      filters: [
        {
          id: 'classification',
          label: 'Classification',
          type: 'select',
          queryField: 'classification',
          options: [
            { label: 'Class I', value: 'Class I' },
            { label: 'Class II', value: 'Class II' },
            { label: 'Class III', value: 'Class III' },
          ],
        },
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          queryField: 'status',
          options: [
            { label: 'Active', value: 'Ongoing' },
            { label: 'Terminated', value: 'Terminated' },
            { label: 'Completed', value: 'Completed' },
          ],
        },
        { id: 'date_range', label: 'Initiation Date', type: 'date-range', queryField: 'recall_initiation_date' },
      ],
    },
    {
      id: 'food-caers',
      label: 'CAERS Events',
      description: 'CFSAN Adverse Event Reporting System — dietary supplements, foods, cosmetics',
      mcpTool: 'openfda_food_events',
      defaultParams: { limit: 25, skip: 0 },
      primaryKey: 'report_number',
      titleField: 'report_number',
      dateField: 'date_created',
      detailView: 'drawer',
      columns: [
        { field: 'report_number', header: 'Report #', width: 'w-32', render: 'text', sortable: true, defaultVisible: true },
        { field: 'date_created', header: 'Created', width: 'w-32', render: 'date', sortable: true, defaultVisible: true },
        { field: 'products.name_brand', header: 'Products', render: 'list', defaultVisible: true },
        { field: 'reactions', header: 'Reactions', render: 'list', defaultVisible: true },
        { field: 'outcomes', header: 'Outcomes', render: 'list', defaultVisible: true },
        { field: 'consumer.age', header: 'Consumer Age', width: 'w-32', render: 'text', defaultVisible: false },
      ],
      filters: [
        { id: 'date_range', label: 'Created Date', type: 'date-range', queryField: 'date_created' },
        {
          id: 'industry_name',
          label: 'Industry',
          type: 'select',
          queryField: 'products.industry_name',
          options: [
            { label: 'Dietary Supplements', value: 'Dietary Supplements' },
            { label: 'Cosmetics', value: 'Cosmetics' },
            { label: 'Foods', value: 'Foods/Beverages' },
          ],
        },
      ],
    },
  ],
}
