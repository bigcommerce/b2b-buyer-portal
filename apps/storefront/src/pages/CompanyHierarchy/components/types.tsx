export interface TreeNodeProps {
  companyId: string | number;
  companyName: string;
  channelFlag: boolean;
}

export type RecursiveNode<T> = T & {
  children?: Array<RecursiveNode<T>>;
};
