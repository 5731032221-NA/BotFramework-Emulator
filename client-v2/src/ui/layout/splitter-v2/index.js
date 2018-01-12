import React from 'react';
import ReactDom from 'react-dom';
import PropTypes from 'prop-types';
import { css } from 'glamor';

import SplitterV2Pane from './pane';
import SplitterV2Handle from './handle';

const CSS = css({
    position: 'relative'
});

const DEFAULT_PANE_SIZE = 200;
const MIN_PRIMARY_SIZE = 0;
const MIN_SECONDARY_SIZE = 0;

export default class SplitterV2 extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.saveContainerRef = this.saveContainerRef.bind(this);
        this.saveSplitterRef = this.saveSplitterRef.bind(this);
        this.savePaneRef = this.savePaneRef.bind(this);

        this.onGrabSplitter = this.onGrabSplitter.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.activeSplitter = null;
        // [ { pane1Index: num, pane2Index: num, ref: splitterRef } ]
        this.splitters = [];
        this.splitNum = 0;
        // [ { size: num, ref: paneRef } ]
        this.panes = [];
        this.paneNum = 0;

        this.state = {
            resizing: false,
            primarySize: 500,
            secondarySize: 500,
            paneSizes: []
        };
    }

    componentWillMount() {
        // set up event listeners
        window.addEventListener('resize', console.log('resized window'));
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);

        this.SPLITTER_CSS = this.props.orientation === 'horizontal' ?

            css({
                height: '10px',
                width: '100%',
                backgroundColor: 'black',
                cursor: 'ns-resize'
            })
        :
            css({
                height: '100%',
                width: '10px',
                backgroundColor: 'black',
                cursor: 'ew-resize'
            });
    }

    componentWillUnmount() {
        // remove event listeners
        window.removeEventListener('resize');
        document.removeEventListener('mousemove');
        document.removeEventListener('mouseup');
    }

    saveContainerRef(element) {
        this.containerRef = element;
    }

    saveSplitterRef(element, index) {
        if (!this.splitters[index]) {
            this.splitters[index] = {};
        }
        this.splitters[index]['ref'] = element;
    }

    savePaneRef(element, index) {
        if (!this.panes[index]) {
            this.panes[index] = {};
        }
        this.panes[index]['ref'] = ReactDom.findDOMNode(element);
    }

    onGrabSplitter(e, splitterIndex) {
        clearSelection();
        // cache splitter dimensions
        this.splitters[splitterIndex]['dimensions'] = this.splitters[splitterIndex]['ref'].getBoundingClientRect();
        this.activeSplitter = splitterIndex;
        this.setState(({ resizing: true }));
    }

    onMouseMove(e) {
        if (this.state.resizing) {
            this.calculatePaneSizes(this.activeSplitter, e);
            clearSelection();
        }
    }

    calculatePaneSizes(splitterIndex, e) {
        // get dimensions of both panes and the splitter
        const pane1Index = this.splitters[splitterIndex]['pane1Index'];
        const pane2Index = this.splitters[splitterIndex]['pane2Index']
        const pane1Dimensions = this.panes[pane1Index]['ref'].getBoundingClientRect();
        const pane2Dimensions = this.panes[pane2Index]['ref'].getBoundingClientRect();
        const splitterDimensions = this.splitters[splitterIndex]['dimensions'];

        // the primary pane's size will be the difference between the top (horizontal) or left (vertical) of the pane,
        // and the mouse's Y (horizontal) or X (vertical) position
        const primarySize = this.panes[pane1Index]['size'] = Math.max((e.clientY - pane1Dimensions.top), MIN_PRIMARY_SIZE);

        // the container size will be the sum of the heights (horizontal) or widths (vertical) of both panes and the splitter
        const containerSize = pane1Dimensions.height + pane2Dimensions.height + splitterDimensions.height;

        // the secondary pane's size will be the remaining height (horizontal) or width (vertical)
        // left in the container after subtracting the size of the splitter and primary pane from the total size
        const secondarySize = this.panes[pane2Index]['size'] = Math.max((containerSize - primarySize - splitterDimensions.height), MIN_SECONDARY_SIZE);

        let currentPaneSizes = this.state.paneSizes;
        currentPaneSizes[pane1Index] = primarySize;
        currentPaneSizes[pane2Index] = secondarySize;
        this.setState(({ paneSizes: currentPaneSizes }));
    }

    onMouseUp(e) {
        // stop resizing
        this.setState(({ resizing: false }));
    }

    render() {
        // jam a splitter handle inbetween each pair of children
        const splitChildren = [];
        this.paneNum = this.splitNum = 0;

        this.props.children.forEach((child, index) => {
            // take a 'snapshot' of the current indices
            // or else they will all use the same value once they are rendered
            const paneIndex = this.paneNum;
            const splitIndex = this.splitNum;

            // add a pane
            if (!this.panes[splitIndex]) {
                this.panes[splitIndex] = {};
            }
            this.panes[splitIndex]['size'] = this.panes[splitIndex]['size'] || DEFAULT_PANE_SIZE;
            const pane = <SplitterV2Pane key={ `pane${paneIndex}` } orientation={ this.props.orientation } size={ this.state.paneSizes[paneIndex] } ref={ x => this.savePaneRef(x, paneIndex) }>{ child }</SplitterV2Pane>;
            splitChildren.push(pane);

            // add a splitter if there is another child after this one
            if (this.props.children[index + 1]) {
                // record which panes this splitter controls
                if (!this.splitters[splitIndex]) {
                    this.splitters[splitIndex] = {};
                }
                this.splitters[splitIndex]["pane1Index"] = splitIndex;
                this.splitters[splitIndex]["pane2Index"] = splitIndex + 1;

                // add a splitter
                const splitter = <div className={ this.SPLITTER_CSS } key={ `splitter${splitIndex}` } ref={ x => this.saveSplitterRef(x, splitIndex) } orientation={ this.props.orientation } onMouseDown={ (e) => this.onGrabSplitter(e, splitIndex) } />;
                splitChildren.push(splitter);
                this.splitNum++;
            }

            this.paneNum++;
        });

        return (
            <div className={ CSS }>
                { splitChildren }
            </div>
        );
    }
}

SplitterV2.propTypes = {
    orientation: PropTypes.oneOf([
        'horizontal',
        'vertical'
    ]).isRequired
}

function clearSelection() {
    if (window.getSelection) {
        if (window.getSelection().empty) {
            window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
            window.getSelection().removeAllRanges();
        }
    } else if (document.selection) {
        document.selection.empty();
    }
}
