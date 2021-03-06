import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import AutoSuggestInput from '../../../../components/AutoSuggestInput';
import Table from '../../../../components/Table';
import { getSearchResults } from '../../../../redux/selectors/players';
import searchAction from '../../../../redux/modules/players/actions/search';
import './MembersSelector.scss';

function getTableConfig(onRemove, onSwitchRole) {
  return {
    uniqueKey: row => row.username,
    columns: [
      {
        key: 'username',
        width: 130,
        className: () => '-primary'
      },
      {
        key: 'role'
      },
      {
        key: 'switch role',
        label: '',
        width: 100,
        transform: (val, row) => (
          <button
            className="table-btn -switch-role"
            type="button"
            onClick={() => onSwitchRole(row.username)}
          >
            Switch role
          </button>
        )
      },
      {
        key: 'remove',
        label: '',
        width: 130,
        transform: (val, row) => (
          <button className="table-btn -remove" type="button" onClick={() => onRemove(row.username)}>
            Remove member
          </button>
        )
      }
    ]
  };
}

function mapToSuggestion(player) {
  return { label: player.username, value: player.username };
}

function MembersSelector({ members, onMemberAdded, onMemberRemoved, onMemberRoleSwitched }) {
  const dispatch = useDispatch();
  const searchResults = useSelector(state => getSearchResults(state));

  const suggestions = useMemo(() => searchResults.map(s => mapToSuggestion(s)), [searchResults]);

  const searchPlayer = _.debounce(username => dispatch(searchAction({ username })), 500);

  const handleInputChange = text => {
    if (text && text.length) {
      searchPlayer(text);
    }
  };

  const handleSelection = username => {
    onMemberAdded(username);
  };

  const handleDeselection = username => {
    onMemberRemoved(username);
  };

  const handleRoleSwitch = username => {
    onMemberRoleSwitched(username);
  };

  const onInputChange = useCallback(handleInputChange, []);
  const onSelected = useCallback(handleSelection, []);
  const onDeselected = useCallback(handleDeselection, []);
  const onRoleSwitch = useCallback(handleRoleSwitch, []);

  const tableConfig = useMemo(() => getTableConfig(onDeselected, onRoleSwitch), [
    onDeselected,
    onRoleSwitch
  ]);

  return (
    <div className="members-selector">
      <AutoSuggestInput
        suggestions={suggestions}
        onInput={onInputChange}
        onSelected={onSelected}
        placeholder="Search players"
        clearOnSelect
      />
      {members && members.length > 0 ? (
        <Table uniqueKeySelector={tableConfig.uniqueKey} columns={tableConfig.columns} rows={members} />
      ) : (
        <span className="empty-selected">No players selected</span>
      )}
    </div>
  );
}

MembersSelector.propTypes = {
  members: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  onMemberAdded: PropTypes.func.isRequired,
  onMemberRemoved: PropTypes.func.isRequired,
  onMemberRoleSwitched: PropTypes.func.isRequired
};

export default MembersSelector;
