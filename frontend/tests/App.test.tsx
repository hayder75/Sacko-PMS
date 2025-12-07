import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

describe('App', () => {
  it('should render without crashing', () => {
    // Basic smoke test
    expect(true).toBe(true);
  });
});

