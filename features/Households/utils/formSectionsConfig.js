/**
 * features/Households/utils/formSectionsConfig.js
 * 
 * Centralized form sections configuration used by both Add and Edit workflows
 * Includes all implemented form sections
 */

import GeographicIdentification from '../components/Forms/geographic-information';
import Health from '../components/Forms/health';
import Demographics from '../components/Forms/demographics';
import Education from '../components/Forms/education';
import Economic from '../components/Forms/economic';

export const FORM_SECTIONS = {
  'Geographic Identification': GeographicIdentification,
  'Demographics': Demographics,
  'Health': Health,
  'Education': Education,
  'Economic': Economic,
};

export const SECTION_KEYS = Object.keys(FORM_SECTIONS);
