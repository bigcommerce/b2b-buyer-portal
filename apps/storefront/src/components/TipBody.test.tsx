import { describe, it, vi, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TipBody from './TipBody';

describe('TipBody', () => {
    it('renders the message', () => {
        render(<TipBody message="Hello world" />);
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders the description if provided', () => {
        render(<TipBody message="Tip" description="This is a description" />);
        expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('does not render the description if not provided', () => {
        render(<TipBody message="Tip" />);
        expect(screen.queryByText('This is a description')).not.toBeInTheDocument();
    });

    it('renders the action button if action is provided', () => {
        const action = { label: 'Click me', onClick: vi.fn() };
        render(<TipBody message="Tip" action={action} />);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('does not render the action button if action is not provided', () => {
        render(<TipBody message="Tip" />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls action.onClick when the button is clicked', async () => {
        const onClick = vi.fn();
        const action = { label: 'Do it', onClick };
        render(<TipBody message="Tip" action={action} />);
        await userEvent.click(screen.getByRole('button', { name: 'Do it' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders message as ReactNode', () => {
        render(<TipBody message={<span data-testid="custom-node">Custom</span>} />);
        expect(screen.getByTestId('custom-node')).toBeInTheDocument();
    });
});