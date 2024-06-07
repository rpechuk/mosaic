import { interval } from '@uwdata/mosaic-core';
import { ascending, min, max, select, interpolateRainbow } from 'd3';
import { brushX, brushY } from './util/brush.js';
import { closeTo } from './util/close-to.js';
import { getField } from './util/get-field.js';
import { invert } from './util/invert.js';
import { patchScreenCTM } from './util/patchScreenCTM.js';
import { sanitizeStyles } from './util/sanitize-styles.js';

export class Interval1D {
  constructor(mark, {
    channel,
    selection,
    field = undefined,
    pixelSize = 1,
    peers = true,
    brush: style
  }) {
    this.mark = mark;
    this.channel = channel;
    this.pixelSize = pixelSize || 1;
    this.selection = selection;
    this.peers = peers;
    this.field = field || getField(mark, channel);
    this.style = style && sanitizeStyles(style);
    this.brush = channel === 'y' ? brushY() : brushX();
    this.brush.on('brush end', (e) => {
      this.publish(e.selection);
      if (e?.type === 'end') this.selection.predict(this.clause(this.value));
    });
  }

  reset() {
    this.value = undefined;
    if (this.g) this.brush.reset(this.g);
  }

  activate() {
    this.selection.activate(this.clause(this.value || [0, 1]));
  }

  publish(extent) {
    let range = undefined;
    if (extent) {
      range = extent
        .map(v => invert(v, this.scale, this.pixelSize))
        .sort((a, b) => a - b);
    }
    if (!closeTo(range, this.value)) {
      this.value = range;
      this.g.call(this.brush.moveSilent, extent);
      this.selection.update(this.clause(range));
    }
  }

  predict(span, client) {
    const lMargin = this.mark.plot.attributes.marginLeft;
    const trueSpan = [span[0] + lMargin, span[1] + lMargin];

    // if the current selection is within 1% of the total range of the prediction, don't draw it
    const delta = (this.scale.domain[1] - this.scale.domain[0]) * 0.05;
    const range = trueSpan.map(v => invert(v, this.scale, this.pixelSize))
                      .sort((a, b) => a - b);
    if (Math.abs(range[0] - this.value[0]) < delta
      && Math.abs(range[1] - this.value[1]) < delta) return;

    const color = interpolateRainbow(client.hash);
    // add a div to the client's plot to show what color the prediction is for that client
    const colorDiv = document.createElement('div');
    // TODO: this is a simple way to show color think of a better way to show this
    colorDiv.style.backgroundColor = color;
    colorDiv.style.width = '10px';
    colorDiv.style.height = '10px';
    colorDiv.style.top = '0px';
    colorDiv.style.left = '0px';
    client.plot.element.appendChild(colorDiv);

    // if the prediction already exists, don't draw it again
    if (this.g.selectAll('.prediction_' + client.hash * 0xFFFFFFFF).size() > 0) return;

    this.drawPrediction(trueSpan, color, client);
  }

  drawPrediction(span, color, client) {
    // get the width of the axis on the left (if there is one) and the top (if there is one)
    const tMargin = this.mark.plot.attributes.marginTop;
    const bMargin = this.mark.plot.attributes.marginBottom;
    const height = this.mark.plot.attributes.height;

    // change the above to the same but use a rect instead of a path and don't include a stroke
    const rect = this.g.append('rect')
      .attr('x', span[0])
      .attr('y', tMargin)
      .attr('height', height - tMargin - bMargin)
      .attr('class', 'prediction_' + client.hash * 0xFFFFFFFF)
      .style('fill', color)
      .style('cursor', 'pointer')
      .style('fill-opacity', 0.3)
      .style('stroke', 'white')
      .style('stroke-width', 1)
      .attr('width', 0);
    rect.transition()
      .attr('width', span[1] - span[0]);

    rect.on('click', () => {
      // TODO use pre-adjustments span instead of start and end here?
      this.g.selectAll('.prediction_' + client.hash * 0xFFFFFFFF).remove();
      this.publish(span);
    });

    rect.on('mouseenter', () => {
      rect.style('fill-opacity', 0.5);
    });

    rect.on('mouseleave', () => {
      rect.style('fill-opacity', 0.3);
    });
  }

  clause(value) {
    const { mark, pixelSize, field, scale } = this;
    return interval(field, value, {
      source: this,
      clients: this.peers ? mark.plot.markSet : new Set().add(mark),
      scale,
      pixelSize
    });
  }

  init(svg, root) {
    const { brush, channel, style } = this;
    this.scale = svg.scale(channel);

    const rx = svg.scale('x').range;
    const ry = svg.scale('y').range;
    brush.extent([[min(rx), min(ry)], [max(rx), max(ry)]]);

    const range = this.value?.map(this.scale.apply).sort(ascending);
    const facets = select(svg).selectAll('g[aria-label="facet"]');
    root = facets.size() ? facets : select(root ?? svg);
    this.g = root
      .append('g')
      .attr('class', `interval-${channel}`)
      .each(patchScreenCTM)
      .call(brush)
      .call(brush.moveSilent, range);

    if (style) {
      const brushes = this.g.selectAll('rect.selection');
      for (const name in style) {
        brushes.attr(name, style[name]);
      }
    }

    svg.addEventListener('pointerenter', evt => {
      if (!evt.buttons) this.activate();
    });
  }
}
