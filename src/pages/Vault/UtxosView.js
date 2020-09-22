import React from 'react';
import styled from 'styled-components';

import UtxoRow from './UtxoRow';

import { white, blue, darkGray, lightBlue } from '../../utils/colors';

const UtxosView = ({ setViewUtxos, currentAccount }) => {

  return (
    <ValueWrapper>
      <TotalValueHeader style={{ cursor: 'pointer' }} onClick={() => setViewUtxos(false)}>Settings - Utxos</TotalValueHeader>
      <SettingsHeadingItem>UTXOs</SettingsHeadingItem>
      <SettingsSection style={{ flexDirection: 'column' }}>
        {currentAccount.availableUtxos.map((utxo) => (
          <UtxoRow flat={true} utxo={utxo} />
        ))}
      </SettingsSection>
    </ValueWrapper>
  )
}

const ValueWrapper = styled.div`
  background: ${lightBlue};
  padding: 1.5em;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px 0 rgba(0,0,0,.06);
  border-top: solid 11px ${blue};
`;

const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  margin: 1em 0;
  justify-content: space-between;
  padding: 0.5em;
  background: ${white};
  border: 1px solid ${darkGray};
`;

const TotalValueHeader = styled.div`
  font-size: 36px;
`;

const SettingsHeadingItem = styled.h3`
  font-size: 1.5em;
  margin: 64px 0 0;
  font-weight: 400;
  color: ${darkGray};
`;

export default UtxosView;