import React from 'react';
import ReactDom from 'react-dom';
import PropTypes from 'prop-types';
import { css } from 'glamor';

import SplitterV2Pane from './pane';
import * as Colors from '../../colors/colors';

const CSS = css({
    height: "100%",
    width: "100%",
    display: 'flex',
    flexFlow: 'column nowrap'
});

const DEFAULT_PANE_SIZE = 200;
const MIN_PRIMARY_SIZE = 0;
const MIN_SECONDARY_SIZE = 0;
const SPLITTER_SIZE = 4;

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
                height: SPLITTER_SIZE,
                width: '100%',
                backgroundColor: Colors.BLACK_1,
                cursor: 'ns-resize',
                flexShrink: 0
            })
        :
            css({
                height: '100%',
                width: SPLITTER_SIZE,
                backgroundColor: Colors.BLACK_1,
                cursor: 'ew-resize',
                flexShrink: 0
            });

        const flexDir = this.props.orientation === 'horizontal' ? 'column' : 'row';
        this.CONTAINER_CSS = css({
            height: "100%",
            width: "100%",
            position: 'relative'
        });

        this.FLOATING_CANVAS_CSS = css({
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            display: 'flex',
            flexFlow: `${flexDir} nowrap`,
        });
    }

    componentDidMount() {
        // calculate initial pane layout
        const currentPaneSizes = this.state.paneSizes;
        const containerDimensions = this.containerRef.getBoundingClientRect();
        const containerSize = this.props.orientation === 'horizontal' ? containerDimensions.height : containerDimensions.width;

        const numberOfPanes = this.props.children.length;
        const numberOfSplitters = numberOfPanes - 1;
        const defaultPaneSize = (containerSize - (numberOfSplitters * SPLITTER_SIZE)) / (numberOfPanes);
        for (let i = 0; i < numberOfPanes; i++) {
            currentPaneSizes[i] = (defaultPaneSize / containerSize * 100) + '%';
        }
        this.setState(({ paneSizes: currentPaneSizes }));
    }

    componentWillUnmount() {
        // remove event listeners
        window.removeEventListener('resize', () => null);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
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
        // cache container size
        this.containerSize = this.props.orientation === 'horizontal' ? this.containerRef.getBoundingClientRect().height : this.containerRef.getBoundingClientRect().width;
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
        let primarySize = this.props.orientation === 'horizontal' ?
                this.panes[pane1Index]['size'] = Math.max((e.clientY - pane1Dimensions.top), MIN_PRIMARY_SIZE)
            :
                this.panes[pane1Index]['size'] = Math.max((e.clientX - pane1Dimensions.left), MIN_PRIMARY_SIZE);

        // the container size will be the sum of the heights (horizontal) or widths (vertical) of both panes and the splitter
        const containerSize = this.props.orientation === 'horizontal' ?
                pane1Dimensions.height + pane2Dimensions.height + splitterDimensions.height
            :
                pane1Dimensions.width + pane2Dimensions.width + splitterDimensions.width;

        // bound the bottom (horizontal) or right (vertical) of the primary pane to the bottom or right of the container
        const splitterSize = this.props.orientation === 'horizontal' ? splitterDimensions.height : splitterDimensions.width;
        if ((primarySize + splitterSize) > containerSize) {
            primarySize = containerSize - splitterSize;
        }

        // the secondary pane's size will be the remaining height (horizontal) or width (vertical)
        // left in the container after subtracting the size of the splitter and primary pane from the total size
        const secondarySize = this.props.orientation === 'horizontal' ?
                this.panes[pane2Index]['size'] = Math.max((containerSize - primarySize - splitterDimensions.height), MIN_SECONDARY_SIZE)
            :
                this.panes[pane2Index]['size'] = Math.max((containerSize - primarySize - splitterDimensions.width), MIN_SECONDARY_SIZE);

        let currentPaneSizes = this.state.paneSizes;
        currentPaneSizes[pane1Index] = (primarySize / this.containerSize * 100) + '%';
        currentPaneSizes[pane2Index] = (secondarySize / this.containerSize * 100) + '%';
        if (this.props.onSizeChange) {
            this.props.onSizeChange(currentPaneSizes);
        }
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
            // take a 'snapshot' of the current indices or else
            // the elements will all use the same value once they are rendered
            const paneIndex = this.paneNum;
            const splitIndex = this.splitNum;

            // add a pane
            if (!this.panes[paneIndex]) {
                this.panes[paneIndex] = {};
            }
            this.panes[paneIndex]['size'] = this.state.paneSizes[paneIndex] || DEFAULT_PANE_SIZE;
            const pane = <SplitterV2Pane key={ `pane${paneIndex}` } orientation={ this.props.orientation }
                            size={ this.state.paneSizes[paneIndex] } ref={ x => this.savePaneRef(x, paneIndex) }>{ child }</SplitterV2Pane>;
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
                const splitter = <div className={ this.SPLITTER_CSS } key={ `splitter${splitIndex}` }
                                    ref={ x => this.saveSplitterRef(x, splitIndex) } orientation={ this.props.orientation }
                                    onMouseDown={ (e) => this.onGrabSplitter(e, splitIndex) } />;
                splitChildren.push(splitter);
                this.splitNum++;
            }

            this.paneNum++;
        });

        return (
            <div ref={ this.saveContainerRef } className={ this.CONTAINER_CSS + ' split-container' }>
                <div className={ this.FLOATING_CANVAS_CSS }>
                    { splitChildren }
                </div>
            </div>
        );
    }
}

SplitterV2.propTypes = {
    orientation: PropTypes.oneOf([
        'horizontal',
        'vertical'
    ]).isRequired,
    minSizes: PropTypes.array,
    initialSizes: PropTypes.array,
    onSizeChange: PropTypes.func
}

/** Used to clear any text selected as a side effect of holding down the mouse and dragging */
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
