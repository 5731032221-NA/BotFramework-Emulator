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

import { css } from 'glamor';
import React from 'react';
import { connect } from 'react-redux';

import * as constants from '../../../constants';
import ExpandCollapse, { Controls as ExpandCollapseControls, Content as ExpandCollapseContent } from '../../layout/expandCollapse';
import { directoryExists, getFilesInDir, fileExists, readFileSync } from '../../utils';
import * as CardActions from '../../../data/action/cardActions';
import { ContentType_Card } from '../../../constants';
import * as EditorActions from '../../../data/action/editorActions';
import CardExplorerFile from './cardExplorerFile';
import * as Colors from '../../colors/colors';

const CSS = css({
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    backgroundColor: Colors.EXPLORER_BACKGROUND_DARK
});

const BOTS_CSS = css({
    display: 'flex',
    flexDirection: 'column',
    listStyleType: 'none',
    margin: 0,
    padding: 0
});

export class CardExplorer extends React.Component {
    constructor(props, context) {
        super(props, context);
    }

    componentWillMount() {
        // look at the current folder and check for cards under it
        const cardsPath = `${this.props.folder}/cards`;
        if (directoryExists(cardsPath)) {
            const files = getFilesInDir(cardsPath);

            const jsonFileRegex = /.json$/;
            for(let i = 0; i < files.length; i++) {
                const file = files[i];
                const filePath = `${cardsPath}/${file}`;

                if (fileExists(filePath) && jsonFileRegex.test(file)) {
                    const cardContent = {
                        title: file,
                        cardJson: readFileSync(filePath) || '{}',
                        cardOutput: [],
                        entities: [],
                        path: filePath,
                        contentType: ContentType_Card
                    };

                    this.props.dispatch(CardActions.createCard(cardContent));
                }
            }
        }
    }

    render() {
        return(
            <ul className={ CSS }>
                <li>
                    <ExpandCollapse
                        initialExpanded={ true }
                        title='Cards'
                    >
                        <ExpandCollapseContent>
                            <ul className={ BOTS_CSS }>
                                {
                                    Object.keys(this.props.cards).length ?
                                        Object.keys(this.props.cards).map(id =>
                                            <CardExplorerFile key={ id } cardId={ id } />
                                        )
                                    :
                                        <li>No cards found...</li>
                                }
                            </ul>
                        </ExpandCollapseContent>
                    </ExpandCollapse>
                </li>
            </ul>
        );
    }
}

export default connect(state => ({
    cards: state.card.cards,
    folder: state.assetExplorer.folder
}))(CardExplorer);
