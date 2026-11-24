/**
 * Explicit Finite State Machine for Major Event Create / Edit Modal Dialog.
 */

export const EMPTY_EVENT_FORM = {
  id: '',
  name: '',
  tag: '',
  year: 2026,
  start: '2026-11-14',
  end: '2026-11-15',
  scope: 'global',
  series: 'GO Fest',
  backgroundType: 'specialbackground',
  location: '',
  raidMegaIdsText: '',
  regionalRareIdsText: '',
  raidSummary: '',
  specialSummary: '',
  hasMighty: false,
  attended: true,
  isCustom: true,
};

export const INITIAL_EVENT_MODAL_STATE = {
  mode: 'closed', // 'closed' | 'create' | 'edit'
  eventId: null,
  isCustom: false,
  form: EMPTY_EVENT_FORM,
};

export function transitionEventModal(state, event) {
  switch (event?.type) {
    case 'OPEN_CREATE': {
      const refDate = String(event.referenceDate || '2026-11-14');
      const id = String(event.id || `custom-${Date.now()}`);
      return {
        mode: 'create',
        eventId: id,
        isCustom: true,
        form: {
          ...EMPTY_EVENT_FORM,
          id,
          start: refDate,
          end: refDate,
          year: Number(refDate.slice(0, 4)) || 2026,
          isCustom: true,
        },
      };
    }

    case 'OPEN_EDIT': {
      const ev = event.eventItem;
      if (!ev) return state;
      return {
        mode: 'edit',
        eventId: ev.id,
        isCustom: Boolean(ev.isCustom),
        form: {
          id: ev.id,
          name: ev.name || '',
          tag: ev.tag || '',
          year: ev.year || 2026,
          start: ev.start || '',
          end: ev.end || ev.start || '',
          scope: ev.scope || 'global',
          series: ev.series || 'City & Special',
          backgroundType: ev.backgroundType || 'none',
          location: ev.location || '',
          raidMegaIdsText: (ev.raidMegaIds || ev.dexIds || []).join(', '),
          regionalRareIdsText: (ev.regionalRareIds || []).join(', '),
          raidSummary: ev.raidSummary || ev.featuredSpecies || '',
          specialSummary: ev.specialSummary || '',
          hasMighty: Boolean(ev.hasMighty),
          attended: Boolean(ev.attended),
          isCustom: Boolean(ev.isCustom),
        },
      };
    }

    case 'UPDATE_FIELD': {
      if (state.mode === 'closed' || !event.field) return state;
      return {
        ...state,
        form: {
          ...state.form,
          [event.field]: event.value,
        },
      };
    }

    case 'CLOSE':
      if (state.mode === 'closed') return state;
      return {
        ...state,
        mode: 'closed',
      };

    default:
      return state;
  }
}
