import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import Button from '@/components/ui/Button'

describe('Button component', () => {
  it('renders the button text', () => {
    render(<Button>Click me</Button>)

    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Click</Button>)

    await user.click(screen.getByText('Click'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
