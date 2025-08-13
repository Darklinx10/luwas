import React from 'react';
import RequiredField from '@/components/Required'; // Make sure the path is correct

export default function MemberField({ member, index, handleMemberChange, selectFields, difficultyOptions, handleDifficultyChange }) {
  return (
    <fieldset className="border border-gray-300 rounded p-4 mb-4 space-y-4">
      <legend className="text-sm font-semibold text-gray-600 px-2">
        Household Member {index + 1}
      </legend>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { id: 'lastName', label: 'Last Name', placeholder: 'Enter your Last Name' },
          { id: 'firstName', label: 'First Name', placeholder: 'Enter your First Name' },
          { id: 'middleName', label: 'Middle Name', placeholder: 'Enter your Middle Name' },
          { id: 'suffix', label: 'Suffix', placeholder: 'Enter your Suffix' },
          { id: 'birthdate', label: 'Birthdate', type: 'date' },
          { id: 'age', label: 'Age', type: 'number' },
          { id: 'contactNumber', label: 'Contact Number', type: 'tel', pattern: '^09\\d{9}$', maxLength: 11, placeholder: 'e.g., 09123456789', title: 'Enter an 11-digit number starting with 09' },
          { id: 'ethnicity', label: 'Ethnicity', placeholder: 'Enter your Ethnicity' },
          { id: 'religion', label: 'Religion', placeholder: 'Enter your Religion' },
          { id: 'philsysNumber', label: 'PhilSys Card Number (PCN)', placeholder: 'Enter your PhilSys Card Number' },
          { id: 'lguIdNumber', label: 'LGU ID Number', placeholder: 'Enter your LGU ID Number' },
          { id: 'nuclearBelonging', label: 'In which Nuclear Family Belong?' },
        ].map(({ id, label, type = 'text', optional, ...props }) => (
          <RequiredField
            key={id}
            htmlFor={`${id}-${index}`}
            label={label}
            required={!optional}
          >
            <input
              id={`${id}-${index}`}
              name={id}
              type={type}
              value={member[id] ?? ''}
              onChange={handleMemberChange(index, id)}
              className="border p-2 rounded w-full"
              readOnly={props.readOnly || false}
              {...props}
            />
          </RequiredField>
        ))}

        {[
          'relationshipToHead', 'nuclearRelation', 'sex', 'birthRegistered', 'maritalStatus', 'hasNationalID', 'hasBiometric', 'hasLGUID', 'soloParent', 'soloParentId', 'seniorCitizenId'
        ].map((id) => (
          <RequiredField
            key={id}
            htmlFor={`${id}-${index}`}
            label={id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            required
          >
            <select
              id={`${id}-${index}`}
              name={id}
              value={member[id] ?? ''}
              onChange={handleMemberChange(index, id)}
              className="border p-2 rounded w-full"
            >
              {selectFields[id].map((opt, i) => (
                <option key={i} value={opt}>{opt || 'Select answer'}</option>
              ))}
            </select>
          </RequiredField>
        ))}

        <p className="text-green-700 sm:col-span-2 font-semibold pt-2">For all persons 5 years old and over</p>
        {difficultyOptions.map((q, dIdx) => {
          const id = `difficulty-${index}-${dIdx}`;
          return (
            <RequiredField key={id} htmlFor={id} label={q} required>
              <select
                id={id}
                name={id}
                className="border p-2 rounded w-full"
                value={member.difficulties[q] ?? ''}
                onChange={handleDifficultyChange(index, q)}
              >
                <option value="">Select difficulty level</option>
                <option value="No difficulty">No difficulty</option>
                <option value="Some difficulty">Some difficulty</option>
                <option value="A lot of difficulty">A lot of difficulty</option>
                <option value="Cannot do at all">Cannot do at all</option>
              </select>
            </RequiredField>
          );
        })}
      </div>
    </fieldset>
  );
}
