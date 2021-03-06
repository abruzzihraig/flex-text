(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.FlexText = factory();
    }
}(this, function () {
    'use strict';

    // init measuring element
    var oc = document.createElement('canvas');
    var octx = oc.getContext('2d');

    var BASE_FONT_SIZE = 100;

    function async(fn) {
        if (typeof window.requestAnimationFrame === 'function') {
            requestAnimationFrame(fn);
        } else {
            setTimeout(fn, 0);
        }
    }

    function checkElem(elem, name) {
        if (!elem || elem.nodeType !== 1) {
            throw new TypeError('expect `' + (name || 'elem') + '` to be an Element, but got ' + typeof elem);
        }

        return true;
    }

    function getStyle(el, prop) {
        if (typeof window.getComputedStyle === 'function') {
            return getComputedStyle(el)[prop];
        }

        prop = prop.replace(/-(\w)/g, function (m, $1) {
            return $1.toUpperCase();
        });

        return el.currentStyle[prop];
    }

    function getWidth(el) {
        var bound = el.getBoundingClientRect();

        return bound.width || (bound.right - bound.left);
    };

    function forEach(arr, fn) {
        if (typeof arr.forEach === 'function') {
            return arr.forEach(fn);
        }

        for (var i = 0, max = arr.length; i < max; i++) {
            fn(arr[i], i, arr);
        }
    }

    function map(arr, fn) {
        if (typeof arr.map === 'function') {
            return arr.map(fn);
        }

        var res = [];

        for (var i = 0, max = arr.length; i < max; i++) {
            res.push(fn(arr[i], i, arr));
        }

        return res;
    }

    function FlexText(options) {
        options = options || {};

        this.items = [];

        this.setSpacing(options.spacing);

        this.setBaseFontSize(options.baseFontSize);

        this.setContainerWidth(options.containerWidth);

        if (options.items && options.items.length) {
            var self = this;

            forEach(options.items, function (v) {
                self.addItem(v);
            });
        }

        if (options.container) {
            this.attachTo(options.container);
        }
    }

    FlexText.prototype.attachTo = function attachTo(container) {
        checkElem(container, 'container');

        this.container = container;
        this.update();
    };

    FlexText.prototype.setSpacing = function setSpacing(val) {
        this.spacing = parseFloat(val) || 0;
    };

    FlexText.prototype.setContainerWidth = function setContainerWidth(val) {
        this.containerWidth = parseFloat(val) || 0;
    };

    FlexText.prototype.setBaseFontSize = function setBaseFontSize(val) {
        this.baseFontSize = parseFloat(val) || 0;
    };

    FlexText.prototype.addItem = function addItem(item) {
        if (!item) return;

        checkElem(item.elem, 'elem');

        if (item.flex <= 0) {
            throw new Error('expect flex to be greater than 0, but got ' + item.flex);
        }

        this.items.push({
            elem: item.elem,
            flex: item.flex,
        });
    };

    FlexText.prototype.removeItem = function removeItem(elem) {
        checkElem(elem, 'elem');

        var items = this.items;

        for (var i = 0, max = items.length; i < max; i++) {
            if (elem === items[i].elem) {
                return items.splice(i, 1);
            }
        }
    };

    FlexText.prototype.clear = function clear() {
        this.items.length = 0;
    };

    FlexText.prototype.alloc = function alloc() {
        var items = this.items;
        var spacing = this.spacing;
        var container = this.container;
        var baseFontSize = this.baseFontSize;

        var totalSpace = this.containerWidth || getWidth(container);

        var widths = [];
        var totalWidth = 0;

        var whiteSpaceCount = items.length - 1;

        forEach(items, function (item) {
            var elem = item.elem;
            var flex = item.flex;

            var text = elem.textContent || elem.innerText;
            var fontSize = (baseFontSize || BASE_FONT_SIZE) * flex;

            if (!text && whiteSpaceCount > 0) {
                whiteSpaceCount--;
            }

            var fontFamily = getStyle(elem, 'font-family');
            var fontWeight = getStyle(elem, 'font-weight');

            var font = fontWeight + ' ' + fontSize + 'px / 1 ' + fontFamily;

            octx.font = font;
            var width = octx.measureText(text).width;

            widths.push(width);
            totalWidth += width;
        });

        totalSpace -= parseFloat(spacing) * whiteSpaceCount;

        if (baseFontSize && totalWidth < totalSpace) {
            return map(widths, function (w, i) {
                return {
                    elem: items[i].elem,
                    fontSize: baseFontSize * items[i].flex
                };
            });
        } else {
            return map(widths, function (w, i) {
                var item = items[i];

                var fontSize = (baseFontSize || BASE_FONT_SIZE) * item.flex;
                var targetWidth = (w / totalWidth) * totalSpace;

                return {
                    elem: item.elem,
                    fontSize: Math.max(0, fontSize / (w / targetWidth)),
                };
            });
        }
    };

    FlexText.prototype.render = function render() {
        var spacing = this.spacing;

        var result = this.alloc();

        forEach(result, function (item, idx) {
            var elem = item.elem;
            var fontSize = item.fontSize;

            elem.style.fontSize = Math.floor(fontSize) + 'px';

            if (idx > 0) {
                elem.style.marginLeft = spacing + 'px';
            }
        });
    };

    FlexText.prototype.update = function update() {
        var self = this;

        async(function () {
            self.render();
        });
    };

    return FlexText;
}));
