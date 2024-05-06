import styled from '@emotion/styled';

interface ContainerProps {
  padding?: string;
  flexBasis?: string;
  alignItems?: string;
  backgroundColor?: string;
  width?: string;
  xs?: {
    [key: string]: string | number;
  };
  flexDirection?:
    | 'column'
    | 'inherit'
    | '-moz-initial'
    | 'initial'
    | 'revert'
    | 'unset'
    | 'column-reverse'
    | 'row'
    | 'row-reverse';
}

const Container = styled('div')(
  ({
    padding = '1rem',
    alignItems = 'flex-start',
    flexDirection = 'row',
    backgroundColor = 'white',
    width = '100%',
    xs,
  }: ContainerProps) => ({
    display: 'flex',
    flexDirection,
    alignItems,
    padding,
    width,
    backgroundColor,
    ...xs,
  }),
);

export default Container;
