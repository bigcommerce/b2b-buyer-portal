export interface OpenPageState {
  isOpen: boolean;
  openUrl?: string;
  handleEnterClick?: (href: string, bool: boolean) => void;
  params?: { [key: string]: string };
}
