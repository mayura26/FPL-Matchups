import { render, fireEvent, screen } from '@testing-library/react';
import App from './App';
import nock from 'nock';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  // cleaning up the mess left behind the previous test
  cleanup();
});

test('navigates through all pages and triggers fetch', async () => {
  // Set up the mock response
  nock('http://localhost')
    .get('/api/game-data')
    .reply(200, {
      data: {
        events: [
          {
            id: 1,
            is_current: true,
            finished: false
          }
        ]
      },
      apiLive: true
    });

  // Render the App component
  render(<App />);

  // Check if the Home page is displayed
  expect(screen.getByText('Welcome to the FPL Analysis Tool')).toBeInTheDocument();

  // Set the teamID
  fireEvent.change(screen.getByPlaceholderText('Enter your team ID'), { target: { value: '948006' } });

  // Wait for the 'Fetch Squad' button to be displayed
  const fetchButton = await screen.findByText('Fetch Squad');

  // Click on the 'Fetch Squad' button on the Home page
  fireEvent.click(fetchButton);
});