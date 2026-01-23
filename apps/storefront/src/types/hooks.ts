export interface OpenPageState {
  isOpen: boolean;
  openUrl?: string;
  handleEnterClick?: (href: string, bool: boolean) => void;
  params?: Record<string, string>;
  authorizedPages?: string;
}
