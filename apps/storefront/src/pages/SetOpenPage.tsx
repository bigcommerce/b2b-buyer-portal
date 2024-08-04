export type SetOpenPage = (value: {
  isOpen: boolean;
  openUrl?: string;
  params?: Record<string, string>;
}) => void;
