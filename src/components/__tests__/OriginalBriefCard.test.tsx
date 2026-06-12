import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OriginalBriefCard from '../OriginalBriefCard';

const fullBrief = {
  notes: 'Grade II listed\nNo driveway / on-street only\nAsbestos in garage roof',
  tasks: ['Remove old kitchen', 'Install units'],
  propertyType: 'Semi-Detached',
  size: '5m x 4m (20m²)',
  specLevel: 'premium',
  constructionMethodLabel: 'Timber frame',
  numberOfRooms: '3',
  numberOfFloors: '2',
  photos: ['file:///photo1.jpg', 'file:///photo2.jpg'],
  voiceNotes: 'walked through the site',
};

describe('OriginalBriefCard', () => {
  it('renders collapsed by default — header visible, body hidden', () => {
    const { getByText, queryByText } = render(<OriginalBriefCard siteNotes={fullBrief} />);
    expect(getByText('Original brief')).toBeTruthy();
    // Section content is not rendered until expanded.
    expect(queryByText('Your notes')).toBeNull();
    expect(queryByText('Grade II listed')).toBeNull();
  });

  it('expands on press and shows notes as separate bullet lines', () => {
    const { getByText, queryByText } = render(<OriginalBriefCard siteNotes={fullBrief} />);
    fireEvent.press(getByText('Original brief'));

    expect(getByText('Your notes')).toBeTruthy();
    expect(getByText('Grade II listed')).toBeTruthy();
    expect(getByText('No driveway / on-street only')).toBeTruthy();
    expect(getByText('Asbestos in garage roof')).toBeTruthy();

    // Selected work + property details surface too.
    expect(getByText('Selected work')).toBeTruthy();
    expect(getByText('Remove old kitchen')).toBeTruthy();
    expect(getByText('Property details')).toBeTruthy();
    expect(getByText('Semi-Detached')).toBeTruthy();
    expect(getByText('Premium')).toBeTruthy(); // capitalised spec level
    expect(getByText('Timber frame')).toBeTruthy();
    expect(getByText('Photos (2)')).toBeTruthy();
    expect(getByText('Voice notes were included with this assessment')).toBeTruthy();

    // Toggling again collapses.
    fireEvent.press(getByText('Original brief'));
    expect(queryByText('Your notes')).toBeNull();
  });

  it('respects defaultExpanded', () => {
    const { getByText } = render(<OriginalBriefCard siteNotes={fullBrief} defaultExpanded />);
    expect(getByText('Grade II listed')).toBeTruthy();
  });

  it('hides sections that have no data', () => {
    const { getByText, queryByText } = render(
      <OriginalBriefCard siteNotes={{ notes: 'Just one note' }} defaultExpanded />
    );
    expect(getByText('Just one note')).toBeTruthy();
    expect(queryByText('Selected work')).toBeNull();
    expect(queryByText('Property details')).toBeNull();
    expect(queryByText(/Photos/)).toBeNull();
    expect(queryByText('Voice notes were included with this assessment')).toBeNull();
  });

  it('renders nothing when the brief is effectively empty', () => {
    const { toJSON } = render(
      <OriginalBriefCard siteNotes={{ notes: '   ', tasks: [], photos: [] }} />
    );
    expect(toJSON()).toBeNull();
  });

  it('is read-only — exposes no text inputs', () => {
    const { UNSAFE_queryAllByProps } = render(
      <OriginalBriefCard siteNotes={fullBrief} defaultExpanded />
    );
    // No editable inputs of any kind.
    expect(UNSAFE_queryAllByProps({ editable: true })).toHaveLength(0);
  });
});
