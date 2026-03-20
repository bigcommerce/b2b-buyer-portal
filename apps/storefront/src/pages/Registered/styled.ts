import styled from '@emotion/styled';

export const InformationLabels = styled('h3')(() => ({
  margin: '1rem 0',
  display: 'flex',
  justifyContent: 'center',
  fontSize: '34px',
  fontWeight: '400',
}));

export const RegisteredContainer = styled('div')((props: CustomFieldItems) => {
  const { isMobile = false } = props;
  const style = isMobile
    ? {}
    : {
        padding: '20px 40px',
      };

  return style;
});

export const RegisteredImage = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
});
