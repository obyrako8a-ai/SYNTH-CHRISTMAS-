import {
  useEffect,
  useRef,
  useState
} from 'react'

const STEPS = 16

const NOTE_SETS = {
  violin: ['C5', 'D5', 'E5', 'G5'],
  horn: ['C2', 'D2', 'F2', 'G2'],
  bells: ['C6', 'E6', 'G6', 'A6'],
  flute: ['C5', 'E5', 'G5', 'A5']
}

const INITIAL_PATTERNS = {
  violin: [
    0, null, 1, null,
    2, null, 3, null,
    2, null, 1, null,
    0, null, 2, null
  ],

  horn: [
    0, null, null, null,
    3, null, null, null,
    2, null, null, null,
    0, null, 3, null
  ],

  bells: [
    0, null, 2, null,
    null, 3, null, 2,
    0, null, 2, null,
    3, null, 2, null
  ],

  flute: [
    null, null, 0, null,
    null, 2, null, null,
    3, null, null, 2,
    null, 0, null, null
  ],

  kick: [
    1, 0, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0
  ],

  snare: [
    0, 0, 1, 0,
    0, 0, 1, 0,
    0, 0, 1, 0,
    0, 0, 1, 0
  ],

  hat: [
    1, 0, 1, 0,
    1, 0, 1, 0,
    1, 0, 1, 0,
    1, 0, 1, 0
  ]
}

const INSTRUMENTS = [
  {
    id: 'violin',
    title: 'VIOLIN',
    presets: [
      'SMOOTH',
      'WARM',
      'AIR'
    ]
  },

  {
    id: 'horn',
    title: 'LOW HORN',
    presets: [
      'DEEP',
      'WARM',
      'BRIGHT'
    ]
  },

  {
    id: 'bells',
    title: 'BELLS',
    presets: [
      'CRYSTAL',
      'BRIGHT',
      'SOFT'
    ]
  },

  {
    id: 'flute',
    title: 'FLUTE',
    presets: [
      'AIR',
      'GLASS',
      'BREATH'
    ]
  }
]

function clonePatterns() {
  return JSON.parse(
    JSON.stringify(INITIAL_PATTERNS)
  )
}

function App() {
  const ToneRef = useRef(null)

  const audio = useRef(null)

  const sequences = useRef({})

  const patterns = useRef(
    clonePatterns()
  )

  const initialized = useRef(false)

  const enabledRef = useRef({
    violin: true,
    horn: true,
    bells: true,
    flute: true,
    drums: true
  })

  const [audioReady, setAudioReady] =
    useState(false)

  const [playing, setPlaying] =
    useState(false)

  const [currentStep, setCurrentStep] =
    useState(-1)

  const [presets, setPresets] =
    useState({
      violin: 'SMOOTH',
      horn: 'DEEP',
      bells: 'CRYSTAL',
      flute: 'AIR'
    })

  const [enabled, setEnabled] =
    useState({
      violin: true,
      horn: true,
      bells: true,
      flute: true,
      drums: true
    })

  const [speeds, setSpeeds] =
    useState({
      violin: 1,
      horn: 1,
      bells: 1,
      flute: 1,
      drums: 1
    })

  const [volumes, setVolumes] =
    useState({
      violin: 0.75,
      horn: 0.9,
      bells: 0.7,
      flute: 0.75,
      drums: 0.9
    })

  const [, forceUpdate] =
    useState(0)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  /*
   * TONE LOAD
   *
   * Tone is loaded only after a
   * real user action.
   */

  async function loadTone() {
    if (!ToneRef.current) {
      const module =
        await import('tone')

      ToneRef.current = module
    }

    return ToneRef.current
  }

  /*
   * AUDIO INITIALIZATION
   */

  async function initializeAudio() {
    const Tone =
      await loadTone()

    if (initialized.current) {
      if (
        Tone.getContext().state !==
        'running'
      ) {
        await Tone.start()
        await Tone.getContext().resume()
      }

      return
    }

    await Tone.start()

    if (
      Tone.getContext().state !==
      'running'
    ) {
      await Tone.getContext().resume()
    }

    Tone.getTransport().bpm.value = 96

    /*
     * MASTER
     */

    const master =
      new Tone.Volume(0)

    master.toDestination()

    /*
     * VIOLIN
     */

    const violinVolume =
      new Tone.Volume(-5)

    const violinFilter =
      new Tone.Filter({
        type: 'lowpass',
        frequency: 3500,
        rolloff: -12
      })

    const violin =
      new Tone.PolySynth(
        Tone.Synth,
        {
          maxPolyphony: 6,

          oscillator: {
            type: 'triangle'
          },

          envelope: {
            attack: 0.04,
            decay: 0.12,
            sustain: 0.55,
            release: 0.45
          }
        }
      )

    violin.chain(
      violinFilter,
      violinVolume,
      master
    )

    /*
     * LOW HORN
     *
     * Bright and loud.
     */

    const hornVolume =
      new Tone.Volume(-1)

    const horn =
      new Tone.MonoSynth({
        oscillator: {
          type: 'sawtooth'
        },

        envelope: {
          attack: 0.04,
          decay: 0.12,
          sustain: 0.7,
          release: 0.5
        },

        filter: {
          type: 'lowpass',
          frequency: 1800,
          rolloff: -12
        },

        filterEnvelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.55,
          release: 0.4,
          baseFrequency: 180,
          octaves: 3
        }
      })

    horn.chain(
      hornVolume,
      master
    )

    /*
     * BELLS
     */

    const bellsVolume =
      new Tone.Volume(-4)

    const bells =
      new Tone.MetalSynth({
        frequency: 320,
        harmonicity: 5.1,
        modulationIndex: 18,
        resonance: 3500,
        octaves: 1.5,

        envelope: {
          attack: 0.001,
          decay: 0.45,
          release: 0.65
        }
      })

    bells.chain(
      bellsVolume,
      master
    )

    /*
     * FLUTE
     */

    const fluteVolume =
      new Tone.Volume(-3)

    const flute =
      new Tone.MonoSynth({
        oscillator: {
          type: 'sine'
        },

        envelope: {
          attack: 0.06,
          decay: 0.1,
          sustain: 0.7,
          release: 0.4
        },

        filter: {
          type: 'lowpass',
          frequency: 3500,
          rolloff: -12
        },

        filterEnvelope: {
          attack: 0.02,
          decay: 0.12,
          sustain: 0.45,
          release: 0.4,
          baseFrequency: 500,
          octaves: 2
        }
      })

    flute.chain(
      fluteVolume,
      master
    )

    /*
     * DRUMS
     */

    const kickVolume =
      new Tone.Volume(-1)

    const snareVolume =
      new Tone.Volume(-2)

    const hatVolume =
      new Tone.Volume(-2)

    const kick =
      new Tone.MembraneSynth({
        pitchDecay: 0.04,
        octaves: 5,

        oscillator: {
          type: 'sine'
        },

        envelope: {
          attack: 0.001,
          decay: 0.22,
          sustain: 0.04,
          release: 0.25
        }
      })

    const snare =
      new Tone.NoiseSynth({
        noise: {
          type: 'white'
        },

        envelope: {
          attack: 0.001,
          decay: 0.16,
          sustain: 0
        }
      })

    const hat =
      new Tone.MetalSynth({
        frequency: 5000,
        harmonicity: 5.1,
        modulationIndex: 35,
        resonance: 5000,
        octaves: 1.5,

        envelope: {
          attack: 0.001,
          decay: 0.07,
          release: 0.04
        }
      })

    kick.chain(
      kickVolume,
      master
    )

    snare.chain(
      snareVolume,
      master
    )

    hat.chain(
      hatVolume,
      master
    )

    /*
     * SAVE AUDIO
     */

    audio.current = {
      master,

      violin,
      horn,
      bells,
      flute,

      kick,
      snare,
      hat,

      violinVolume,
      hornVolume,
      bellsVolume,
      fluteVolume,

      kickVolume,
      snareVolume,
      hatVolume
    }

    /*
     * CREATE SEQUENCES
     */

    createMelodySequence(
      'violin',
      violin,
      NOTE_SETS.violin,
      0.7
    )

    createMelodySequence(
      'horn',
      horn,
      NOTE_SETS.horn,
      0.9
    )

    createMelodySequence(
      'bells',
      bells,
      NOTE_SETS.bells,
      0.8,
      true
    )

    createMelodySequence(
      'flute',
      flute,
      NOTE_SETS.flute,
      0.8
    )

    createDrumSequence(
      'kick',
      kick,
      'kick',
      1
    )

    createDrumSequence(
      'snare',
      snare,
      'snare',
      1
    )

    createDrumSequence(
      'hat',
      hat,
      'hat',
      0.9
    )

    initialized.current = true

    setAudioReady(true)
  }

  /*
   * MELODY SEQUENCES
   */

  function createMelodySequence(
    id,
    synth,
    notes,
    velocity,
    isMetal = false
  ) {
    const Tone =
      ToneRef.current

    const sequence =
      new Tone.Sequence(
        (time, step) => {
          if (
            !enabledRef.current[id]
          ) {
            return
          }

          const pattern =
            patterns.current[id]

          const noteIndex =
            pattern[step]

          if (
            noteIndex === null ||
            noteIndex === undefined
          ) {
            return
          }

          const note =
            notes[noteIndex]

          synth.triggerAttackRelease(
            note,
            isMetal
              ? '16n'
              : '8n',
            time,
            velocity
          )

          if (id === 'violin') {
            Tone.Draw.schedule(
              () => {
                setCurrentStep(step)
              },
              time
            )
          }
        },

        Array.from(
          { length: STEPS },
          (_, index) => index
        ),

        '16n'
      )

    sequence.start(0)

    sequences.current[id] =
      sequence
  }

  /*
   * DRUM SEQUENCES
   */

  function createDrumSequence(
    id,
    synth,
    patternName,
    velocity
  ) {
    const Tone =
      ToneRef.current

    const sequence =
      new Tone.Sequence(
        (time, step) => {
          if (
            !enabledRef.current.drums
          ) {
            return
          }

          const pattern =
            patterns.current[
              patternName
            ]

          if (!pattern[step]) {
            return
          }

          if (id === 'kick') {
            synth.triggerAttackRelease(
              'C1',
              '8n',
              time,
              velocity
            )
          }

          if (id === 'snare') {
            synth.triggerAttackRelease(
              '16n',
              time,
              velocity
            )
          }

          if (id === 'hat') {
            synth.triggerAttackRelease(
              '32n',
              time,
              velocity
            )
          }
        },

        Array.from(
          { length: STEPS },
          (_, index) => index
        ),

        '16n'
      )

    sequence.start(0)

    sequences.current[id] =
      sequence
  }

  /*
   * ENSURE AUDIO
   */

  async function ensureAudio() {
    await initializeAudio()

    const Tone =
      ToneRef.current

    if (
      Tone.getContext().state !==
      'running'
    ) {
      await Tone.start()
      await Tone.getContext().resume()
    }
  }

  /*
   * START / STOP
   */

  async function togglePlayback() {
    await ensureAudio()

    const Tone =
      ToneRef.current

    const transport =
      Tone.getTransport()

    if (
      transport.state ===
      'started'
    ) {
      transport.stop()

      setPlaying(false)
      setCurrentStep(-1)
    } else {
      transport.start()

      setPlaying(true)
    }
  }

  /*
   * ON / OFF
   */

  async function toggleInstrument(id) {
    await ensureAudio()

    setEnabled(prev => {
      const next = {
        ...prev,
        [id]: !prev[id]
      }

      enabledRef.current = next

      return next
    })
  }

  /*
   * VOLUME
   */

  function updateVolume(
    id,
    value
  ) {
    if (!audio.current) {
      return
    }

    const normalized =
      Number(value)

    if (id === 'drums') {
      const base =
        -10 +
        normalized * 10

      audio.current.kickVolume
        .volume.value = base

      audio.current.snareVolume
        .volume.value =
        base - 1

      audio.current.hatVolume
        .volume.value =
        base - 1

      return
    }

    const volume =
      -10 +
      normalized * 10

    const node =
      audio.current[
        `${id}Volume`
      ]

    if (node) {
      node.volume.value =
        volume
    }
  }

  function changeVolume(
    id,
    value
  ) {
    const number =
      Number(value)

    setVolumes(prev => ({
      ...prev,
      [id]: number
    }))

    updateVolume(
      id,
      number
    )
  }

  /*
   * SPEED
   */

  function changeSpeed(
    id,
    value
  ) {
    const speed =
      Number(value)

    setSpeeds(prev => ({
      ...prev,
      [id]: speed
    }))

    if (!initialized.current) {
      return
    }

    if (id === 'drums') {
      sequences.current.kick
        .playbackRate = speed

      sequences.current.snare
        .playbackRate = speed

      sequences.current.hat
        .playbackRate = speed

      return
    }

    if (
      sequences.current[id]
    ) {
      sequences.current[id]
        .playbackRate = speed
    }
  }

  /*
   * PRESETS
   */

  function applyPreset(
    id,
    preset
  ) {
    setPresets(prev => ({
      ...prev,
      [id]: preset
    }))

    if (!audio.current) {
      return
    }

    const instrument =
      audio.current[id]

    if (!instrument) {
      return
    }

    /*
     * VIOLIN
     */

    if (id === 'violin') {
      if (preset === 'SMOOTH') {
        instrument.oscillator.type =
          'triangle'

        instrument.envelope.attack =
          0.05

        instrument.envelope.release =
          0.5
      }

      if (preset === 'WARM') {
        instrument.oscillator.type =
          'sine'

        instrument.envelope.attack =
          0.1

        instrument.envelope.release =
          0.7
      }

      if (preset === 'AIR') {
        instrument.oscillator.type =
          'triangle'

        instrument.envelope.attack =
          0.18

        instrument.envelope.release =
          1
      }
    }

    /*
     * HORN
     */

    if (id === 'horn') {
      if (preset === 'DEEP') {
        instrument.oscillator.type =
          'sine'

        instrument.filter.frequency.value =
          1000
      }

      if (preset === 'WARM') {
        instrument.oscillator.type =
          'triangle'

        instrument.filter.frequency.value =
          1700
      }

      if (preset === 'BRIGHT') {
        instrument.oscillator.type =
          'sawtooth'

        instrument.filter.frequency.value =
          2500
      }
    }

    /*
     * BELLS
     */

    if (id === 'bells') {
      if (preset === 'CRYSTAL') {
        instrument.frequency.value =
          320

        instrument.resonance =
          4200
      }

      if (preset === 'BRIGHT') {
        instrument.frequency.value =
          430

        instrument.resonance =
          5200
      }

      if (preset === 'SOFT') {
        instrument.frequency.value =
          250

        instrument.resonance =
          2500
      }
    }

    /*
     * FLUTE
     */

    if (id === 'flute') {
      if (preset === 'AIR') {
        instrument.oscillator.type =
          'sine'

        instrument.filter.frequency.value =
          2800
      }

      if (preset === 'GLASS') {
        instrument.oscillator.type =
          'triangle'

        instrument.filter.frequency.value =
          4000
      }

      if (preset === 'BREATH') {
        instrument.oscillator.type =
          'sine'

        instrument.filter.frequency.value =
          2200
      }
    }
  }

  /*
   * MELODY GRID
   */

  function changeCell(
    id,
    row,
    step
  ) {
    const pattern =
      [...patterns.current[id]]

    if (
      pattern[step] === row
    ) {
      pattern[step] = null
    } else {
      pattern[step] = row
    }

    patterns.current[id] =
      pattern

    forceUpdate(
      value => value + 1
    )
  }

  /*
   * DRUM GRID
   */

  function changeDrumCell(
    id,
    step
  ) {
    const pattern =
      [...patterns.current[id]]

    pattern[step] =
      pattern[step] ? 0 : 1

    patterns.current[id] =
      pattern

    forceUpdate(
      value => value + 1
    )
  }

  /*
   * RESET
   */

  function resetEverything() {
    patterns.current =
      clonePatterns()

    setPlaying(false)
    setCurrentStep(-1)

    setSpeeds({
      violin: 1,
      horn: 1,
      bells: 1,
      flute: 1,
      drums: 1
    })

    setVolumes({
      violin: 0.75,
      horn: 0.9,
      bells: 0.7,
      flute: 0.75,
      drums: 0.9
    })

    forceUpdate(
      value => value + 1
    )

    if (!initialized.current) {
      return
    }

    const Tone =
      ToneRef.current

    Tone.getTransport().stop()

    Object.values(
      sequences.current
    ).forEach(sequence => {
      sequence.playbackRate = 1
    })

    updateVolume(
      'violin',
      0.75
    )

    updateVolume(
      'horn',
      0.9
    )

    updateVolume(
      'bells',
      0.7
    )

    updateVolume(
      'flute',
      0.75
    )

    updateVolume(
      'drums',
      0.9
    )
  }

  /*
   * CLEANUP
   */

  useEffect(() => {
    return () => {
      if (
        initialized.current &&
        ToneRef.current
      ) {
        try {
          const Tone =
            ToneRef.current

          Tone.getTransport().stop()
          Tone.getTransport().cancel()
        } catch (error) {
          console.log(error)
        }
      }
    }
  }, [])

  return (
    <div className="app">

      <header className="header">

        <div>
          <h1>
            CHRISTMAS SYNTH
          </h1>

          <div className="audio-status">
            {audioReady
              ? 'LET IT SNOW'
              : 'LET IT SNOW'}
          </div>
        </div>

        <div className="header-actions">

          <button
            className="main-button"
            onClick={
              togglePlayback
            }
          >
            {playing
              ? 'STOP'
              : 'START'}
          </button>

          <button
            className="reset-button"
            onClick={
              resetEverything
            }
          >
            RESET
          </button>

        </div>

      </header>

      <main>

        <section className="instrument-layout">

          {INSTRUMENTS.map(
            instrument => (
              <Instrument
                key={
                  instrument.id
                }

                instrument={
                  instrument
                }

                pattern={
                  patterns.current[
                    instrument.id
                  ]
                }

                preset={
                  presets[
                    instrument.id
                  ]
                }

                speed={
                  speeds[
                    instrument.id
                  ]
                }

                volume={
                  volumes[
                    instrument.id
                  ]
                }

                enabled={
                  enabled[
                    instrument.id
                  ]
                }

                currentStep={
                  currentStep
                }

                onToggle={() =>
                  toggleInstrument(
                    instrument.id
                  )
                }

                onPresetChange={
                  value =>
                    applyPreset(
                      instrument.id,
                      value
                    )
                }

                onSpeedChange={
                  value =>
                    changeSpeed(
                      instrument.id,
                      value
                    )
                }

                onVolumeChange={
                  value =>
                    changeVolume(
                      instrument.id,
                      value
                    )
                }

                onCellClick={
                  (row, step) =>
                    changeCell(
                      instrument.id,
                      row,
                      step
                    )
                }
              />
            )
          )}

        </section>

        <DrumMachine
          pattern={
            patterns.current
          }

          speed={
            speeds.drums
          }

          volume={
            volumes.drums
          }

          enabled={
            enabled.drums
          }

          currentStep={
            currentStep
          }

          onToggle={() =>
            toggleInstrument(
              'drums'
            )
          }

          onSpeedChange={
            value =>
              changeSpeed(
                'drums',
                value
              )
          }

          onVolumeChange={
            value =>
              changeVolume(
                'drums',
                value
              )
          }

          onCellClick={
            changeDrumCell
          }
        />

      </main>

    </div>
  )
}

/*
 * INSTRUMENT
 */

function Instrument({
  instrument,
  pattern,
  preset,
  speed,
  volume,
  enabled,
  currentStep,
  onToggle,
  onPresetChange,
  onSpeedChange,
  onVolumeChange,
  onCellClick
}) {
  return (
    <section className="instrument">

      <div className="instrument-title">

        <h2>
          {instrument.title}
        </h2>

        <button
          className={
            enabled
              ? 'power-button active'
              : 'power-button'
          }
          onClick={onToggle}
        >
          {enabled
            ? 'ON'
            : 'OFF'}
        </button>

      </div>

      <div className="instrument-controls">

        <select
          value={preset}
          onChange={event =>
            onPresetChange(
              event.target.value
            )
          }
        >
          {instrument.presets.map(
            option => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            )
          )}
        </select>

        <label className="slider-control">

          <span>
            SPEED
          </span>

          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={speed}
            onChange={event =>
              onSpeedChange(
                event.target.value
              )
            }
          />

        </label>

        <label className="slider-control">

          <span>
            VOLUME
          </span>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={event =>
              onVolumeChange(
                event.target.value
              )
            }
          />

        </label>

      </div>

      <div className="melody-grid">

        {[0, 1, 2, 3].map(
          row => (
            <div
              className="melody-row"
              key={row}
            >

              {Array.from(
                {
                  length: STEPS
                },
                (_, step) => {

                  const active =
                    pattern[step] === row

                  const isPlaying =
                    currentStep === step

                  return (
                    <button
                      key={step}
                      className={[
                        'cell',

                        active
                          ? 'active'
                          : '',

                        isPlaying
                          ? 'playing'
                          : ''
                      ].join(' ')}
                      onClick={() =>
                        onCellClick(
                          row,
                          step
                        )
                      }
                    />
                  )
                }
              )}

            </div>
          )
        )}

      </div>

    </section>
  )
}

/*
 * DRUM MACHINE
 */

function DrumMachine({
  pattern,
  speed,
  volume,
  enabled,
  currentStep,
  onToggle,
  onSpeedChange,
  onVolumeChange,
  onCellClick
}) {
  return (
    <section className="drums">

      <div className="drum-header">

        <div className="drum-title">

          <h2>
            DRUM MACHINE
          </h2>

          <button
            className={
              enabled
                ? 'power-button active'
                : 'power-button'
            }
            onClick={onToggle}
          >
            {enabled
              ? 'ON'
              : 'OFF'}
          </button>

        </div>

        <div className="drum-controls">

          <label className="slider-control">

            <span>
              SPEED
            </span>

            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speed}
              onChange={event =>
                onSpeedChange(
                  event.target.value
                )
              }
            />

          </label>

          <label className="slider-control">

            <span>
              VOLUME
            </span>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={event =>
                onVolumeChange(
                  event.target.value
                )
              }
            />

          </label>

        </div>

      </div>

      <DrumRow
        pattern={
          pattern.kick
        }
        currentStep={
          currentStep
        }
        onClick={step =>
          onCellClick(
            'kick',
            step
          )
        }
      />

      <DrumRow
        pattern={
          pattern.snare
        }
        currentStep={
          currentStep
        }
        onClick={step =>
          onCellClick(
            'snare',
            step
          )
        }
      />

      <DrumRow
        pattern={
          pattern.hat
        }
        currentStep={
          currentStep
        }
        onClick={step =>
          onCellClick(
            'hat',
            step
          )
        }
      />

    </section>
  )
}

function DrumRow({
  pattern,
  currentStep,
  onClick
}) {
  return (
    <div className="drum-row">

      <div className="drum-grid">

        {Array.from(
          {
            length: STEPS
          },
          (_, step) => (
            <button
              key={step}
              className={[
                'drum-cell',

                pattern[step]
                  ? 'active'
                  : '',

                currentStep === step
                  ? 'playing'
                  : ''
              ].join(' ')}
              onClick={() =>
                onClick(step)
              }
            />
          )
        )}

      </div>

    </div>
  )
}

export default App