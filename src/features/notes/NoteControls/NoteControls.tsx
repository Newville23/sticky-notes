import { useState } from 'react'
import {
  NOTE_BACKGROUNDS,
  NOTE_SIZE_PRESETS,
  type NoteBackground,
  type NoteSizePreset,
} from '../../../domain'
import {
  DEFAULT_NOTE_CREATION_CONFIGURATION,
  type NoteCreationConfiguration,
} from '../noteCreation'
import './NoteControls.css'

const NOTE_SIZE_OPTIONS = Object.keys(NOTE_SIZE_PRESETS) as NoteSizePreset[]

export interface NoteControlsProps {
  readonly onConfigurationChange: (
    configuration: NoteCreationConfiguration,
  ) => void
}

export function NoteControls({ onConfigurationChange }: NoteControlsProps) {
  const [configuration, setConfiguration] = useState<NoteCreationConfiguration>(
    DEFAULT_NOTE_CREATION_CONFIGURATION,
  )

  const selectSize = (size: NoteSizePreset) => {
    const nextConfiguration = { ...configuration, size }

    setConfiguration(nextConfiguration)
    onConfigurationChange(nextConfiguration)
  }

  const selectBackground = (background: NoteBackground) => {
    const nextConfiguration = { ...configuration, background }

    setConfiguration(nextConfiguration)
    onConfigurationChange(nextConfiguration)
  }

  return (
    <div className="note-controls">
      <div className="note-controls__brand">
        <span className="note-controls__brand-mark" aria-hidden="true"></span>
        <h1 className="note-controls__title">Sticky Notes</h1>
      </div>

      <div className="note-controls__divider" aria-hidden="true"></div>

      <fieldset className="note-controls__group">
        <legend className="note-controls__label">Size</legend>
        <div className="note-controls__options">
          {NOTE_SIZE_OPTIONS.map((size) => {
            const [width, height] = NOTE_SIZE_PRESETS[size]

            return (
              <button
                key={size}
                className="note-controls__size"
                type="button"
                aria-label={`${size} note size`}
                aria-pressed={configuration.size === size}
                title={`${width} × ${height} pixels`}
                onClick={() => selectSize(size)}
              >
                {size}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="note-controls__divider" aria-hidden="true"></div>

      <fieldset className="note-controls__group">
        <legend className="note-controls__label">Color</legend>
        <div className="note-controls__options note-controls__options--colors">
          {NOTE_BACKGROUNDS.map((background) => (
            <button
              key={background}
              className="note-controls__color"
              type="button"
              aria-label={`${background} note background`}
              aria-pressed={configuration.background === background}
              onClick={() => selectBackground(background)}
            >
              <span
                className={`note-controls__swatch note-controls__swatch--${background}`}
                aria-hidden="true"
              ></span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
