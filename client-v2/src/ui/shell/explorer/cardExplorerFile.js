//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
// Microsoft Bot Framework: http://botframework.com
//
// Bot Framework Emulator Github:
// https://github.com/Microsoft/BotFramwork-Emulator
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

import PropTypes from 'prop-types';
import React from 'react'
import { connect } from 'react-redux';
import { css } from 'glamor';

import * as EditorActions from '../../../data/action/editorActions';
import { ContentType_Card } from '../../../constants';
import * as Colors from '../../colors/colors';

const CSS = css({
    color: Colors.EXPLORER_FOREGROUND_DARK,
    padding: '4px 24px',
    fontFamily: '\'Segoe UI\', \'Helvetica Neue\', \'Arial\', \'sans-serif\''
});

class CardExplorerFile extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.handleFileClick = this.handleFileClick.bind(this);
    }

    handleFileClick() {
        this.props.dispatch(EditorActions.open(ContentType_Card, this.props.cardId));
    }

    render() {
        return (<li className={ CSS } onClick={ this.handleFileClick }>{ this.props.fileName }</li>);
    }
}

CardExplorerFile.propTypes = {
    cardId: PropTypes.string.isRequired,
    fileName: PropTypes.string.isRequired
};

export default connect((state, { cardId }) => ({
    fileName: state.card.cards[cardId].title
}))(CardExplorerFile);
