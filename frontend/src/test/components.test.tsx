import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { SignalScoreGauge } from '../components/SignalScoreGauge';

describe('DisclaimerBanner Component', () => {
  it('renders mandatory educational disclaimer and warning notice', () => {
    render(<DisclaimerBanner />);
    
    expect(screen.getByText(/Educational Tool Only:/i)).toBeInTheDocument();
    expect(screen.getByText(/strictly NOT financial advice/i)).toBeInTheDocument();
    expect(screen.getByText(/significant capital risk/i)).toBeInTheDocument();
  });

  it('allows user to dismiss the banner', () => {
    render(<DisclaimerBanner />);
    const dismissButton = screen.getByTitle(/dismiss warning/i);
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(screen.queryByText(/Educational Tool Only:/i)).not.toBeInTheDocument();
  });
});

describe('SignalScoreGauge Component', () => {
  it('renders bullish score and category badge correctly', () => {
    render(<SignalScoreGauge score={55.5} category="Bullish" />);

    expect(screen.getByText('+55.5')).toBeInTheDocument();
    expect(screen.getByText('Bullish')).toBeInTheDocument();
    expect(screen.getByText(/Composite Signal Score/i)).toBeInTheDocument();
  });

  it('renders bearish negative score correctly', () => {
    render(<SignalScoreGauge score={-42.0} category="Bearish" />);

    expect(screen.getByText('-42.0')).toBeInTheDocument();
    expect(screen.getByText('Bearish')).toBeInTheDocument();
  });

  it('clamps extreme scores within -100 and +100', () => {
    render(<SignalScoreGauge score={120} category="Strong Bullish" />);

    expect(screen.getByText('+120.0')).toBeInTheDocument();
    expect(screen.getByText('Strong Bullish')).toBeInTheDocument();
  });
});
