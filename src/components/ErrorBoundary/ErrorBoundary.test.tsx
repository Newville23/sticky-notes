import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function BrokenComponent(): never {
  throw new Error('Render failed')
}

describe('ErrorBoundary', () => {
  it('renders its children while they are healthy', () => {
    render(
      <ErrorBoundary>
        <p>Application content</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Application content')).toBeInTheDocument()
  })

  it('renders an accessible fallback after a descendant fails', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    try {
      render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>,
      )

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Something went wrong',
      )
      expect(
        screen.getByRole('button', { name: 'Reload application' }),
      ).toBeInTheDocument()
      expect(consoleError).toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })
})
