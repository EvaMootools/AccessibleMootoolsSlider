// Stand der Änderung: 16.06.2010  									Autoren: Eva Lösch, Philip Fieber, Daniel Kramer
// Alle Änderungen die vorgenommen wurden dienen der Barrierefreiheit. Diese Änderungen sind mit einem Kommentar zur 
// Funktionalität und dem Schlüsselwort "extended" gekennzeichnet.
// Beispiel:

// --- extended ----------- Anfang Bearbeitet --------------------------------
// 'Binds' muss ergänzt werden um den Quellcode lauffähig zu machen

//Binds: ['onKeyPress'],

// ------------------------- Ende Bearbeitet ---------------------------------


//MooTools More, <http://mootools.net/more>. Copyright (c) 2006-2009 Aaron Newton <http://clientcide.com/>, Valerio Proietti <http://mad4milk.net> & the MooTools team <http://mootools.net/developers>, MIT Style License.

/*
 ---
 script: More.js
 description: MooTools More
 license: MIT-style license
 authors:
 - Guillermo Rauch
 - Thomas Aylott
 - Scott Kyle
 requires:
 - core:1.2.4/MooTools
 provides: [MooTools.More]
 ...
 */
MooTools.More = {
    'version': '1.2.4.4',
    'build': '6f6057dc645fdb7547689183b2311063bd653ddf'
};

/*
 ---
 script: MooTools.Lang.js
 description: Provides methods for localization.
 license: MIT-style license
 authors:
 - Aaron Newton
 requires:
 - core:1.2.4/Events
 - /MooTools.More
 provides: [MooTools.Lang]
 ...
 */
(function(){

    var data = {
        language: 'en-US',
        languages: {
            'en-US': {}
        },
        cascades: ['en-US']
    };
    
    var cascaded;
    
    MooTools.lang = new Events();
    
    $extend(MooTools.lang, {
    
        setLanguage: function(lang){
            if (!data.languages[lang]) 
                return this;
            data.language = lang;
            this.load();
            this.fireEvent('langChange', lang);
            return this;
        },
        
        load: function(){
            var langs = this.cascade(this.getCurrentLanguage());
            cascaded = {};
            $each(langs, function(set, setName){
                cascaded[setName] = this.lambda(set);
            }, this);
        },
        
        getCurrentLanguage: function(){
            return data.language;
        },
        
        addLanguage: function(lang){
            data.languages[lang] = data.languages[lang] || {};
            return this;
        },
        
        cascade: function(lang){
            var cascades = (data.languages[lang] || {}).cascades || [];
            cascades.combine(data.cascades);
            cascades.erase(lang).push(lang);
            var langs = cascades.map(function(lng){
                return data.languages[lng];
            }, this);
            return $merge.apply(this, langs);
        },
        
        lambda: function(set){
            (set || {}).get = function(key, args){
                return $lambda(set[key]).apply(this, $splat(args));
            };
            return set;
        },
        
        get: function(set, key, args){
            if (cascaded && cascaded[set]) 
                return (key ? cascaded[set].get(key, args) : cascaded[set]);
        },
        
        set: function(lang, set, members){
            this.addLanguage(lang);
            langData = data.languages[lang];
            if (!langData[set]) 
                langData[set] = {};
            $extend(langData[set], members);
            if (lang == this.getCurrentLanguage()) {
                this.load();
                this.fireEvent('langChange', lang);
            }
            return this;
        },
        
        list: function(){
            return Hash.getKeys(data.languages);
        }
        
    });
    
})();

/*
 ---
 script: Class.Refactor.js
 description: Extends a class onto itself with new property, preserving any items attached to the class's namespace.
 license: MIT-style license
 authors:
 - Aaron Newton
 requires:
 - core:1.2.4/Class
 - /MooTools.More
 provides: [Class.refactor]
 ...
 */
Class.refactor = function(original, refactors){

    $each(refactors, function(item, name){
        var origin = original.prototype[name];
        if (origin && (origin = origin._origin) && typeof item == 'function') 
            original.implement(name, function(){
                var old = this.previous;
                this.previous = origin;
                var value = item.apply(this, arguments);
                this.previous = old;
                return value;
            });
        else 
            original.implement(name, item);
    });
    
    return original;
    
};

/*
 ---
 script: Class.Binds.js
 description: Automagically binds specified methods in a class to the instance of the class.
 license: MIT-style license
 authors:
 - Aaron Newton
 requires:
 - core:1.2.4/Class
 - /MooTools.More
 provides: [Class.Binds]
 ...
 */
Class.Mutators.Binds = function(binds){
    return binds;
};

Class.Mutators.initialize = function(initialize){
    return function(){
        $splat(this.Binds).each(function(name){
            var original = this[name];
            if (original) 
                this[name] = original.bind(this);
        }, this);
        return initialize.apply(this, arguments);
    };
};


/*
 ---
 script: Class.Occlude.js
 description: Prevents a class from being applied to a DOM element twice.
 license: MIT-style license.
 authors:
 - Aaron Newton
 requires:
 - core/1.2.4/Class
 - core:1.2.4/Element
 - /MooTools.More
 provides: [Class.Occlude]
 ...
 */
Class.Occlude = new Class({

    occlude: function(property, element){
        element = document.id(element || this.element);
        var instance = element.retrieve(property || this.property);
        if (instance && !$defined(this.occluded)) 
            return this.occluded = instance;
        
        this.occluded = false;
        element.store(property || this.property, this);
        return this.occluded;
    }
    
});

/*
 ---
 script: Element.Measure.js
 description: Extends the Element native object to include methods useful in measuring dimensions.
 credits: "Element.measure / .expose methods by Daniel Steigerwald License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"
 license: MIT-style license
 authors:
 - Aaron Newton
 requires:
 - core:1.2.4/Element.Style
 - core:1.2.4/Element.Dimensions
 - /MooTools.More
 provides: [Element.Measure]
 ...
 */
Element.implement({

    measure: function(fn){
        var vis = function(el){
            return !!(!el || el.offsetHeight || el.offsetWidth);
        };
        if (vis(this)) 
            return fn.apply(this);
        var parent = this.getParent(), restorers = [], toMeasure = [];
        while (!vis(parent) && parent != document.body) {
            toMeasure.push(parent.expose());
            parent = parent.getParent();
        }
        var restore = this.expose();
        var result = fn.apply(this);
        restore();
        toMeasure.each(function(restore){
            restore();
        });
        return result;
    },
    
    expose: function(){
        if (this.getStyle('display') != 'none') 
            return $empty;
        var before = this.style.cssText;
        this.setStyles({
            display: 'block',
            position: 'absolute',
            visibility: 'hidden'
        });
        return function(){
            this.style.cssText = before;
        }
.bind(this);
    },
    
    getDimensions: function(options){
        options = $merge({
            computeSize: false
        }, options);
        var dim = {};
        var getSize = function(el, options){
            return (options.computeSize) ? el.getComputedSize(options) : el.getSize();
        };
        var parent = this.getParent('body');
        if (parent && this.getStyle('display') == 'none') {
            dim = this.measure(function(){
                return getSize(this, options);
            });
        }
        else 
            if (parent) {
                try { //safari sometimes crashes here, so catch it
                    dim = getSize(this, options);
                } 
                catch (e) {
                }
            }
            else {
                dim = {
                    x: 0,
                    y: 0
                };
            }
        return $chk(dim.x) ? $extend(dim, {
            width: dim.x,
            height: dim.y
        }) : $extend(dim, {
            x: dim.width,
            y: dim.height
        });
    },
    
    getComputedSize: function(options){
        options = $merge({
            styles: ['padding', 'border'],
            plains: {
                height: ['top', 'bottom'],
                width: ['left', 'right']
            },
            mode: 'both'
        }, options);
        var size = {
            width: 0,
            height: 0
        };
        switch (options.mode) {
            case 'vertical':
                delete size.width;
                delete options.plains.width;
                break;
            case 'horizontal':
                delete size.height;
                delete options.plains.height;
                break;
        }
        var getStyles = [];
        //this function might be useful in other places; perhaps it should be outside this function?
        $each(options.plains, function(plain, key){
            plain.each(function(edge){
                options.styles.each(function(style){
                    getStyles.push((style == 'border') ? style + '-' + edge + '-' + 'width' : style + '-' + edge);
                });
            });
        });
        var styles = {};
        getStyles.each(function(style){
            styles[style] = this.getComputedStyle(style);
        }, this);
        var subtracted = [];
        $each(options.plains, function(plain, key){ //keys: width, height, plains: ['left', 'right'], ['top','bottom']
            var capitalized = key.capitalize();
            size['total' + capitalized] = size['computed' + capitalized] = 0;
            plain.each(function(edge){ //top, left, right, bottom
                size['computed' + edge.capitalize()] = 0;
                getStyles.each(function(style, i){ //padding, border, etc.
                    //'padding-left'.test('left') size['totalWidth'] = size['width'] + [padding-left]
                    if (style.test(edge)) {
                        styles[style] = styles[style].toInt() || 0; //styles['padding-left'] = 5;
                        size['total' + capitalized] = size['total' + capitalized] + styles[style];
                        size['computed' + edge.capitalize()] = size['computed' + edge.capitalize()] + styles[style];
                    }
                    //if width != width (so, padding-left, for instance), then subtract that from the total
                    if (style.test(edge) && key != style &&
                    (style.test('border') || style.test('padding')) &&
                    !subtracted.contains(style)) {
                        subtracted.push(style);
                        size['computed' + capitalized] = size['computed' + capitalized] - styles[style];
                    }
                });
            });
        });
        
        ['Width', 'Height'].each(function(value){
            var lower = value.toLowerCase();
            if (!$chk(size[lower])) 
                return;
            
            size[lower] = size[lower] + this['offset' + value] + size['computed' + value];
            size['total' + value] = size[lower] + size['total' + value];
            delete size['computed' + value];
        }, this);
        
        return $extend(styles, size);
    }
    
});

/*
 ---
 script: Element.Position.js
 description: Extends the Element native object to include methods useful positioning elements relative to others.
 license: MIT-style license
 authors:
 - Aaron Newton
 requires:
 - core:1.2.4/Element.Dimensions
 - /Element.Measure
 provides: [Elements.Position]
 ...
 */
(function(){

    var original = Element.prototype.position;
    
    Element.implement({
    
        position: function(options){
            //call original position if the options are x/y values
            if (options && ($defined(options.x) || $defined(options.y))) 
                return original ? original.apply(this, arguments) : this;
            $each(options || {}, function(v, k){
                if (!$defined(v)) 
                    delete options[k];
            });
            options = $merge({
                // minimum: { x: 0, y: 0 },
                // maximum: { x: 0, y: 0},
                relativeTo: document.body,
                position: {
                    x: 'center', //left, center, right
                    y: 'center' //top, center, bottom
                },
                edge: false,
                offset: {
                    x: 0,
                    y: 0
                },
                returnPos: false,
                relFixedPosition: false,
                ignoreMargins: false,
                ignoreScroll: false,
                allowNegative: false
            }, options);
            //compute the offset of the parent positioned element if this element is in one
            var parentOffset = {
                x: 0,
                y: 0
            }, parentPositioned = false;
            /* dollar around getOffsetParent should not be necessary, but as it does not return
             * a mootools extended element in IE, an error occurs on the call to expose. See:
             * http://mootools.lighthouseapp.com/projects/2706/tickets/333-element-getoffsetparent-inconsistency-between-ie-and-other-browsers */
            var offsetParent = this.measure(function(){
                return document.id(this.getOffsetParent());
            });
            if (offsetParent && offsetParent != this.getDocument().body) {
                parentOffset = offsetParent.measure(function(){
                    return this.getPosition();
                });
                parentPositioned = offsetParent != document.id(options.relativeTo);
                options.offset.x = options.offset.x - parentOffset.x;
                options.offset.y = options.offset.y - parentOffset.y;
            }
            //upperRight, bottomRight, centerRight, upperLeft, bottomLeft, centerLeft
            //topRight, topLeft, centerTop, centerBottom, center
            var fixValue = function(option){
                if ($type(option) != 'string') 
                    return option;
                option = option.toLowerCase();
                var val = {};
                if (option.test('left')) 
                    val.x = 'left';
                else 
                    if (option.test('right')) 
                        val.x = 'right';
                    else 
                        val.x = 'center';
                if (option.test('upper') || option.test('top')) 
                    val.y = 'top';
                else 
                    if (option.test('bottom')) 
                        val.y = 'bottom';
                    else 
                        val.y = 'center';
                return val;
            };
            options.edge = fixValue(options.edge);
            options.position = fixValue(options.position);
            if (!options.edge) {
                if (options.position.x == 'center' && options.position.y == 'center') 
                    options.edge = {
                        x: 'center',
                        y: 'center'
                    };
                else 
                    options.edge = {
                        x: 'left',
                        y: 'top'
                    };
            }
            
            this.setStyle('position', 'absolute');
            var rel = document.id(options.relativeTo) || document.body, calc = rel == document.body ? window.getScroll() : rel.getPosition(), top = calc.y, left = calc.x;
            
            var dim = this.getDimensions({
                computeSize: true,
                styles: ['padding', 'border', 'margin']
            });
            var pos = {}, prefY = options.offset.y, prefX = options.offset.x, winSize = window.getSize();
            switch (options.position.x) {
                case 'left':
                    pos.x = left + prefX;
                    break;
                case 'right':
                    pos.x = left + prefX + rel.offsetWidth;
                    break;
                default: //center
                    pos.x = left + ((rel == document.body ? winSize.x : rel.offsetWidth) / 2) + prefX;
                    break;
            }
            switch (options.position.y) {
                case 'top':
                    pos.y = top + prefY;
                    break;
                case 'bottom':
                    pos.y = top + prefY + rel.offsetHeight;
                    break;
                default: //center
                    pos.y = top + ((rel == document.body ? winSize.y : rel.offsetHeight) / 2) + prefY;
                    break;
            }
            if (options.edge) {
                var edgeOffset = {};
                
                switch (options.edge.x) {
                    case 'left':
                        edgeOffset.x = 0;
                        break;
                    case 'right':
                        edgeOffset.x = -dim.x - dim.computedRight - dim.computedLeft;
                        break;
                    default: //center
                        edgeOffset.x = -(dim.totalWidth / 2);
                        break;
                }
                switch (options.edge.y) {
                    case 'top':
                        edgeOffset.y = 0;
                        break;
                    case 'bottom':
                        edgeOffset.y = -dim.y - dim.computedTop - dim.computedBottom;
                        break;
                    default: //center
                        edgeOffset.y = -(dim.totalHeight / 2);
                        break;
                }
                pos.x += edgeOffset.x;
                pos.y += edgeOffset.y;
            }
            pos = {
                left: ((pos.x >= 0 || parentPositioned || options.allowNegative) ? pos.x : 0).toInt(),
                top: ((pos.y >= 0 || parentPositioned || options.allowNegative) ? pos.y : 0).toInt()
            };
            var xy = {
                left: 'x',
                top: 'y'
            };
            ['minimum', 'maximum'].each(function(minmax){
                ['left', 'top'].each(function(lr){
                    var val = options[minmax] ? options[minmax][xy[lr]] : null;
                    if (val != null && pos[lr] < val) 
                        pos[lr] = val;
                });
            });
            if (rel.getStyle('position') == 'fixed' || options.relFixedPosition) {
                var winScroll = window.getScroll();
                pos.top += winScroll.y;
                pos.left += winScroll.x;
            }
            if (options.ignoreScroll) {
                var relScroll = rel.getScroll();
                pos.top -= relScroll.y;
                pos.left -= relScroll.x;
            }
            if (options.ignoreMargins) {
                pos.left += (options.edge.x == 'right' ? dim['margin-right'] : options.edge.x == 'center' ? -dim['margin-left'] + ((dim['margin-right'] + dim['margin-left']) / 2) : -dim['margin-left']);
                pos.top += (options.edge.y == 'bottom' ? dim['margin-bottom'] : options.edge.y == 'center' ? -dim['margin-top'] + ((dim['margin-bottom'] + dim['margin-top']) / 2) : -dim['margin-top']);
            }
            pos.left = Math.ceil(pos.left);
            pos.top = Math.ceil(pos.top);
            if (options.returnPos) 
                return pos;
            else 
                this.setStyles(pos);
            return this;
        }
        
    });
    
})();

/*
 ---
 script: Drag.js
 description: The base Drag Class. Can be used to drag and resize Elements using mouse events.
 license: MIT-style license
 authors:
 - Valerio Proietti
 - Tom Occhinno
 - Jan Kassens
 requires:
 - core:1.2.4/Events
 - core:1.2.4/Options
 - core:1.2.4/Element.Event
 - core:1.2.4/Element.Style
 - /MooTools.More
 provides: [Drag]
 */
var Drag = new Class({

    Implements: [Events, Options],
    
    options: {
        /*
         onBeforeStart: $empty(thisElement),
         onStart: $empty(thisElement, event),
         onSnap: $empty(thisElement)
         onDrag: $empty(thisElement, event),
         onCancel: $empty(thisElement),
         onComplete: $empty(thisElement, event),*/
        snap: 6,
        unit: 'px',
        grid: false,
        style: true,
        limit: false,
        handle: false,
        invert: false,
        preventDefault: false,
        stopPropagation: false,
        modifiers: {
            x: 'left',
            y: 'top'
        }
    },
    
    initialize: function(){
        var params = Array.link(arguments, {
            'options': Object.type,
            'element': $defined
        });
        this.element = document.id(params.element);
        this.document = this.element.getDocument();
        this.setOptions(params.options || {});
        var htype = $type(this.options.handle);
        this.handles = ((htype == 'array' || htype == 'collection') ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
        this.mouse = {
            'now': {},
            'pos': {}
        };
        this.value = {
            'start': {},
            'now': {}
        };
        
        this.selection = (Browser.Engine.trident) ? 'selectstart' : 'mousedown';
        
        this.bound = {
            start: this.start.bind(this),
            check: this.check.bind(this),
            drag: this.drag.bind(this),
            stop: this.stop.bind(this),
            cancel: this.cancel.bind(this),
            eventStop: $lambda(false)
        };
        this.attach();
    },
    
    attach: function(){
        this.handles.addEvent('mousedown', this.bound.start);
        
        //touchdevices
        this.handles.addEvent('touchstart', this.bound.start);
        return this;
    },
    
    detach: function(){
        this.handles.removeEvent('mousedown', this.bound.start);
        
        //touchdevices
        this.handles.removeEvent('touchstart', this.bound.start);
        return this;
    },
    
    start: function(event){
        if (event.rightClick) 
            return;
        if (this.options.preventDefault) 
            event.preventDefault();
        if (this.options.stopPropagation) 
            event.stopPropagation();
        this.mouse.start = event.page;
        this.fireEvent('beforeStart', this.element);
        var limit = this.options.limit;
        this.limit = {
            x: [],
            y: []
        };
        for (var z in this.options.modifiers) {
            if (!this.options.modifiers[z]) 
                continue;
            if (this.options.style) 
                this.value.now[z] = this.element.getStyle(this.options.modifiers[z]).toInt();
            else 
                this.value.now[z] = this.element[this.options.modifiers[z]];
            if (this.options.invert) 
                this.value.now[z] *= -1;
            this.mouse.pos[z] = event.page[z] - this.value.now[z];
            if (limit && limit[z]) {
                for (var i = 2; i--; i) {
                    if ($chk(limit[z][i])) 
                        this.limit[z][i] = $lambda(limit[z][i])();
                }
            }
        }
        if ($type(this.options.grid) == 'number') 
            this.options.grid = {
                x: this.options.grid,
                y: this.options.grid
            };
        this.document.addEvents({
            mousemove: this.bound.check,
            mouseup: this.bound.cancel,
            //touchdevices
            touchmove: this.bound.check,
            touchend: this.bound.cancel
        });
        this.document.addEvent(this.selection, this.bound.eventStop);
    },
    
    check: function(event){
        if (this.options.preventDefault) 
            event.preventDefault();
        var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
        if (distance > this.options.snap) {
            this.cancel();
            this.document.addEvents({
                mousemove: this.bound.drag,
                mouseup: this.bound.stop,
                //touchdevices
                touchmove: this.bound.drag,
                touchend: this.bound.stop
            });
            this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
        }
    },
    
    drag: function(event){
        if (this.options.preventDefault) 
            event.preventDefault();
        this.mouse.now = event.page;
        for (var z in this.options.modifiers) {
            if (!this.options.modifiers[z]) 
                continue;
            this.value.now[z] = this.mouse.now[z] - this.mouse.pos[z];
            if (this.options.invert) 
                this.value.now[z] *= -1;
            if (this.options.limit && this.limit[z]) {
                if ($chk(this.limit[z][1]) && (this.value.now[z] > this.limit[z][1])) {
                    this.value.now[z] = this.limit[z][1];
                }
                else 
                    if ($chk(this.limit[z][0]) && (this.value.now[z] < this.limit[z][0])) {
                        this.value.now[z] = this.limit[z][0];
                    }
            }
            if (this.options.grid[z]) 
                this.value.now[z] -= ((this.value.now[z] - (this.limit[z][0] || 0)) % this.options.grid[z]);
            if (this.options.style) {
                this.element.setStyle(this.options.modifiers[z], this.value.now[z] + this.options.unit);
            }
            else {
                this.element[this.options.modifiers[z]] = this.value.now[z];
            }
        }
        this.fireEvent('drag', [this.element, event]);
    },
    
    cancel: function(event){
        this.document.removeEvent('mousemove', this.bound.check);
        this.document.removeEvent('mouseup', this.bound.cancel);
        //touchdevices
        this.document.removeEvent('touchmove', this.bound.check);
        this.document.removeEvent('touchend', this.bound.cancel);
        if (event) {
            this.document.removeEvent(this.selection, this.bound.eventStop);
            this.fireEvent('cancel', this.element);
        }
    },
    
    stop: function(event){
        this.document.removeEvent(this.selection, this.bound.eventStop);
        this.document.removeEvent('mousemove', this.bound.drag);
        this.document.removeEvent('mouseup', this.bound.stop);
        //touchdevices
        this.document.removeEvent('touchmove', this.bound.drag);
        this.document.removeEvent('touchend', this.bound.stop);
        if (event) 
            this.fireEvent('complete', [this.element, event]);
    }
    
});

Element.implement({

    makeResizable: function(options){
        var drag = new Drag(this, $merge({
            modifiers: {
                x: 'width',
                y: 'height'
            }
        }, options));
        this.store('resizer', drag);
        return drag.addEvent('drag', function(){
            this.fireEvent('resize', drag);
        }
.bind(this));
    }
    
});


/*
 ---
 script: Slider.js
 description: Class for creating horizontal and vertical slider controls.
 license: MIT-style license
 authors:
 - Valerio Proietti
 requires:
 - core:1.2.4/Element.Dimensions
 - /Class.Binds
 - /Drag
 - /Element.Dimensions
 - /Element.Measure
 provides: [Slider]
 ...
 */
(function(){

    var $ = document.id;
    
    this.Slider = new Class({
    
        Implements: [Events, Options],
        
        Binds: ['clickedElement', 'draggedKnob', 'scrolledElement', 'clickedElementKeyUp'],
        
        options: {
            /*
             onTick: $empty(intPosition),
             onChange: $empty(intStep),
             onComplete: $empty(strStep),*/
            onTick: function(position){
                if (this.options.snap) 
                    position = this.toPosition(this.step);
                this.knob.setStyle(this.property, position);
                
                // --- extended ----------- Anfang Bearbeitet --------------------------------
                // Wird benötigt damit dr aktuelle Wert des Sliders gelesen wird.
                $(document.body).getElements('.knob').setProperty('aria-valuenow', this.step);
                //		 $(document.body).getElements('.knob').setProperty('aria-valuetext', this.step);
                // ------------------------- Ende Bearbeitet ---------------------------------
            },
            onMoveTick: function(position){
                // --- extended ----------- Anfang Bearbeitet --------------------------------
                // Wird benötigt damit dr aktuelle Wert des Sliders gelesen wird.
                $(document.body).getElements('.knob').setProperty('aria-valuenow', this.step);
                //		 $(document.body).getElements('.knob').setProperty('aria-valuetext', this.step);
                // ------------------------- Ende Bearbeitet ---------------------------------
            },
            initialStep: 0,
            snap: false,
            offset: 0,
            range: false,
            wheel: false,
            steps: 100,
            mode: 'horizontal'
        },
        
        initialize: function(element, knob, options){
            this.setOptions(options);
            this.element = document.id(element);
            this.knob = document.id(knob);
            
            this.previousChange = this.previousEnd = this.step = -1;
            var offset, limit = {}, modifiers = {
                'x': false,
                'y': false
            };
            
            switch (this.options.mode) {
                case 'vertical':
                    this.axis = 'y';
                    this.property = 'top';
                    offset = 'offsetHeight';
                    break;
                case 'horizontal':
                    this.axis = 'x';
                    this.property = 'left';
                    offset = 'offsetWidth';
            }
            
            this.full = this.element.measure(function(){
                this.half = this.knob[offset] / 2;
                return this.element[offset] - this.knob[offset] + (this.options.offset * 2);
            }
.bind(this));
            
            this.min = $chk(this.options.range[0]) ? this.options.range[0] : 0;
            this.max = $chk(this.options.range[1]) ? this.options.range[1] : this.options.steps;
            this.range = this.max - this.min;
            this.steps = this.options.steps || this.full;
            this.stepSize = Math.abs(this.range) / this.steps;
            this.stepWidth = this.stepSize * this.full / Math.abs(this.range);
            
            
            this.knob.setStyle('position', 'relative').setStyle(this.property, this.options.initialStep ? this.toPosition(this.options.initialStep) : -this.options.offset);
            
            modifiers[this.axis] = this.property;
            limit[this.axis] = [-this.options.offset, this.full - this.options.offset];
            
            
            // *********** everything for drag and drop ***********************************
            var dragOptions = {
                preventDefault: true,
                snap: 0,
                limit: limit,
                modifiers: modifiers,
                onDrag: this.draggedKnob,
                onStart: this.draggedKnob,
                onBeforeStart: (function(){
                    this.isDragging = true;
                }).bind(this),
                onCancel: function(){
                    this.isDragging = false;
                }
.bind(this)                ,
                onComplete: function(){
                    this.isDragging = false;
                    this.draggedKnob();
                    this.end();
                }
.bind(this)
            };
            if (this.options.snap) {
                dragOptions.grid = Math.ceil(this.stepWidth);
                dragOptions.limit[this.axis][1] = this.full;
            }
            this.drag = new Drag(this.knob, dragOptions);
            this.attach();
            
            
            // --- extended ----------- Anfang Bearbeitet --------------------------------
            // Notwendige und hinreichende Attribute die dem Element 'knob' zugewiesen werden
            $(document.body).getElements('.knob').setProperty('role', 'slider');
            $(document.body).getElements('.knob').setProperty('aria-valuemin', this.min);
            $(document.body).getElements('.knob').setProperty('aria-valuemax', this.max);
            $(document.body).getElements('.knob').setProperty('aria-valuenow', this.options.initialStep);
            //$(document.body).getElements('.knob').setProperty('aria-valuetext', this.options.initialStep);
            //$(document.body).getElements('.knob').setProperty('aria-live', 'assertive');
            $(document.body).getElements('.knob').setProperty('tabindex', '0');
            this.lastValueNow = this.knob.getProperty('aria-valuenow');
            
            // ------------------------- Ende Bearbeitet ---------------------------------
        
        },
        
        attach: function(){
            this.element.addEvent('mousedown', this.clickedElement);
            this.element.addEvent('touchstart', this.clickedElement);
            
            if (this.options.wheel) 
                this.element.addEvent('mousewheel', this.scrolledElement);
            
            // --- extended ----------- Anfang Bearbeitet --------------------------------
            // Aufruf der Funktion clickedElementKeyUp bei einem Tastendruck. Selbst geschriebener
            // eventlistener.
            this.knob.addEvent('keydown', this.clickedElementKeyUp.bindWithEvent(this));
            
            //VoiceOver compatibility
            this.knob.addEvent('focus', function(){
                var addCount = function(){
                    if (this.knob.getProperty('aria-valuenow') != this.currentValueNow) {
                        step = this.lastValueNow.toInt() + (this.knob.getProperty('aria-valuenow').toInt() - this.lastValueNow.toInt())
                        if (!((this.range > 0) ^ (step < this.min))) {
                            step = this.min;
                            this.fireEvent('moveTick', this.step);
                        }
                        if (!((this.range > 0) ^ (step > this.max))) {
                            step = this.max;
                            this.fireEvent('moveTick', this.step);
                        }
                        
                        this.step = Math.round(step);
                        this.checkStep();
                        position = this.toPosition(this.step);
                        if (this.options.snap) 
                            position = this.toPosition(this.step);
                        this.knob.setStyle(this.property, position);
                        this.lastValueNow = this.knob.getProperty('aria-valuenow')
                    }
                }
.bind(this);
                var timer = addCount.periodical(500, this);
                
                this.knob.addEvents({
                    'touchend': function(){
                        clearInterval(timer);
                        removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                    }
.bind(this)                    ,
                    'mouseup': function(){
                        clearInterval(timer);
                        removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                    }
.bind(this)                    ,
                    'mousemove': function(){
                        clearInterval(timer);
                        removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                    }
.bind(this)                    ,
                    'touchmove': function(){
                        clearInterval(timer);
                        removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                    }
.bind(this)                    ,
                    'blur': function(){
                        clearInterval(timer);
                        removeEvents('touchend', 'mouseup', 'mousemove', 'touchmove', 'blur');
                    }
.bind(this)
                });
            }
.bind(this));
            // ------------------------- Ende Bearbeitet ---------------------------------
            
            this.drag.attach();
            return this;
        },
        
        detach: function(){
            this.element.removeEvent('mousedown', this.clickedElement);
            
            this.element.removeEvent('mousewheel', this.scrolledElement);
            this.drag.detach();
            return this;
        },
        
        set: function(step){
            if (!((this.range > 0) ^ (step < this.min))) 
                step = this.min;
            if (!((this.range > 0) ^ (step > this.max))) 
                step = this.max;
            
            this.step = Math.round(step);
            this.checkStep();
            this.fireEvent('tick', this.toPosition(this.step));
            this.end();
            return this;
        },
        
        // --- extended ----------- Anfang Bearbeitet --------------------------------
        // Die Funktion clickedElementKeyUp verarbeitet die eingegebenen Tasten so das sich
        // der Slider wie gewünscht verhält. 
        clickedElementKeyUp: function(event){
        
            var keyCode;
            
            if (window.event) {
                var e = window.event;
                keyCode = e.keyCode;
            }
            else {
                keyCode = event.code;
            }
            
            //alert(keyCode);
            
            switch (keyCode) {
                case 37: // left arrow
                    this.set(this.step - this.stepSize);
                    //alert('step afterwards: ' + this.step);
                    break;
                case 39: // right arrow
                    this.set(this.step + this.stepSize);
                    //alert('step afterwards: ' + this.step);
                    break;
                case 38: // up arrow
                    this.set(this.step + this.stepSize);
                    //alert('step afterwards: ' + this.step);
                    break;
                    
                case 40: // down arrow
                    this.set(this.step - this.stepSize);
                    //alert('step afterwards: ' + this.step);
                    break;
                case 33: // Bild hoch
                    this.set(this.step + 10 * this.stepSize);
                    break;
                case 34: // Bild runter
                    this.set(this.step - 10 * this.stepSize);
                    break;
                case 36: // Pos 1
                    this.set(this.min);
                    break;
                case 35: // Ende
                    this.set(this.max);
                    break;
            }
        },
        // ------------------------- Ende Bearbeitet ---------------------------------
        
        
        
        clickedElement: function(event){
            this.knob.focus();
            if (this.isDragging || event.target == this.knob) 
                return;
            
            var dir = this.range < 0 ? -1 : 1;
            var position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;
            position = position.limit(-this.options.offset, this.full - this.options.offset);
            
            this.step = Math.round(this.min + dir * this.toStep(position));
            this.checkStep();
            this.fireEvent('tick', position);
            this.end();
        },
        
        scrolledElement: function(event){
            var mode = (this.options.mode == 'horizontal') ? (event.wheel < 0) : (event.wheel > 0);
            this.set(mode ? this.step - this.stepSize : this.step + this.stepSize);
            event.stop();
        },
        
        draggedKnob: function(){
            var dir = this.range < 0 ? -1 : 1;
            var position = this.drag.value.now[this.axis];
            position = position.limit(-this.options.offset, this.full - this.options.offset);
            this.step = Math.round(this.min + dir * this.toStep(position));
            this.checkStep();
            
        },
        
        checkStep: function(){
            if (this.previousChange != this.step) {
                this.previousChange = this.step;
                this.fireEvent('change', this.step);
                this.fireEvent('moveTick', this.step);
            }
        },
        
        end: function(){
            if (this.previousEnd !== this.step) {
                this.previousEnd = this.step;
                this.fireEvent('complete', this.step + '');
            }
        },
        
        toStep: function(position){
            var step = (position + this.options.offset) * this.stepSize / this.full * this.steps;
            return this.options.steps ? Math.round(step -= step % this.stepSize) : step;
        },
        
        toPosition: function(step){
            return (this.full * Math.abs(this.min - step)) / (this.steps * this.stepSize) - this.options.offset;
        }
        
    });
    
})();

/*
 ---
 script: IframeShim.js
 description: Defines IframeShim, a class for obscuring select lists and flash objects in IE.
 license: MIT-style license
 authors:
 - Aaron Newton
 requires:
 - core:1.2.4/Element.Event
 - core:1.2.4/Element.Style
 - core:1.2.4/Options Events
 - /Element.Position
 - /Class.Occlude
 provides: [IframeShim]
 ...
 */
var IframeShim = new Class({

    Implements: [Options, Events, Class.Occlude],
    
    options: {
        className: 'iframeShim',
        src: 'javascript:false;document.write("");',
        display: false,
        zIndex: null,
        margin: 0,
        offset: {
            x: 0,
            y: 0
        },
        browsers: (Browser.Engine.trident4 || (Browser.Engine.gecko && !Browser.Engine.gecko19 && Browser.Platform.mac))
    },
    
    property: 'IframeShim',
    
    initialize: function(element, options){
        this.element = document.id(element);
        if (this.occlude()) 
            return this.occluded;
        this.setOptions(options);
        this.makeShim();
        return this;
    },
    
    makeShim: function(){
        if (this.options.browsers) {
            var zIndex = this.element.getStyle('zIndex').toInt();
            
            if (!zIndex) {
                zIndex = 1;
                var pos = this.element.getStyle('position');
                if (pos == 'static' || !pos) 
                    this.element.setStyle('position', 'relative');
                this.element.setStyle('zIndex', zIndex);
            }
            zIndex = ($chk(this.options.zIndex) && zIndex > this.options.zIndex) ? this.options.zIndex : zIndex - 1;
            if (zIndex < 0) 
                zIndex = 1;
            this.shim = new Element('iframe', {
                src: this.options.src,
                scrolling: 'no',
                frameborder: 0,
                styles: {
                    zIndex: zIndex,
                    position: 'absolute',
                    border: 'none',
                    filter: 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)'
                },
                'class': this.options.className
            }).store('IframeShim', this);
            var inject = (function(){
                this.shim.inject(this.element, 'after');
                this[this.options.display ? 'show' : 'hide']();
                this.fireEvent('inject');
            }).bind(this);
            if (!IframeShim.ready) 
                window.addEvent('load', inject);
            else 
                inject();
        }
        else {
            this.position = this.hide = this.show = this.dispose = $lambda(this);
        }
    },
    
    position: function(){
        if (!IframeShim.ready || !this.shim) 
            return this;
        var size = this.element.measure(function(){
            return this.getSize();
        });
        if (this.options.margin != undefined) {
            size.x = size.x - (this.options.margin * 2);
            size.y = size.y - (this.options.margin * 2);
            this.options.offset.x += this.options.margin;
            this.options.offset.y += this.options.margin;
        }
        this.shim.set({
            width: size.x,
            height: size.y
        }).position({
            relativeTo: this.element,
            offset: this.options.offset
        });
        return this;
    },
    
    hide: function(){
        if (this.shim) 
            this.shim.setStyle('display', 'none');
        return this;
    },
    
    show: function(){
        if (this.shim) 
            this.shim.setStyle('display', 'block');
        return this.position();
    },
    
    dispose: function(){
        if (this.shim) 
            this.shim.dispose();
        return this;
    },
    
    destroy: function(){
        if (this.shim) 
            this.shim.destroy();
        return this;
    }
    
});

window.addEvent('load', function(){
    IframeShim.ready = true;
});

/*
 ---
 script: HtmlTable.js
 description: Builds table elements with methods to add rows.
 license: MIT-style license
 authors:
 - Aaron Newton
 requires:
 - core:1.2.4/Options
 - core:1.2.4/Events
 - /Class.Occlude
 provides: [HtmlTable]
 ...
 */
var HtmlTable = new Class({

    Implements: [Options, Events, Class.Occlude],
    
    options: {
        properties: {
            cellpadding: 0,
            cellspacing: 0,
            border: 0
        },
        rows: [],
        headers: [],
        footers: []
    },
    
    property: 'HtmlTable',
    
    initialize: function(){
        var params = Array.link(arguments, {
            options: Object.type,
            table: Element.type
        });
        this.setOptions(params.options);
        this.element = params.table || new Element('table', this.options.properties);
        if (this.occlude()) 
            return this.occluded;
        this.build();
    },
    
    build: function(){
        this.element.store('HtmlTable', this);
        
        this.body = document.id(this.element.tBodies[0]) || new Element('tbody').inject(this.element);
        $$(this.body.rows);
        
        if (this.options.headers.length) 
            this.setHeaders(this.options.headers);
        else 
            this.thead = document.id(this.element.tHead);
        if (this.thead) 
            this.head = document.id(this.thead.rows[0]);
        
        if (this.options.footers.length) 
            this.setFooters(this.options.footers);
        this.tfoot = document.id(this.element.tFoot);
        if (this.tfoot) 
            this.foot = document.id(this.thead.rows[0]);
        
        this.options.rows.each(function(row){
            this.push(row);
        }, this);
        
        ['adopt', 'inject', 'wraps', 'grab', 'replaces', 'dispose'].each(function(method){
            this[method] = this.element[method].bind(this.element);
        }, this);
    },
    
    toElement: function(){
        return this.element;
    },
    
    empty: function(){
        this.body.empty();
        return this;
    },
    
    set: function(what, items){
        var target = (what == 'headers') ? 'tHead' : 'tFoot';
        this[target.toLowerCase()] = (document.id(this.element[target]) || new Element(target.toLowerCase()).inject(this.element, 'top')).empty();
        var data = this.push(items, {}, this[target.toLowerCase()], what == 'headers' ? 'th' : 'td');
        if (what == 'headers') 
            this.head = document.id(this.thead.rows[0]);
        else 
            this.foot = document.id(this.thead.rows[0]);
        return data;
    },
    
    setHeaders: function(headers){
        this.set('headers', headers);
        return this;
    },
    
    setFooters: function(footers){
        this.set('footers', footers);
        return this;
    },
    
    push: function(row, rowProperties, target, tag){
        var tds = row.map(function(data){
            var td = new Element(tag || 'td', data.properties), type = data.content || data || '', element = document.id(type);
            if ($type(type) != 'string' && element) 
                td.adopt(element);
            else 
                td.set('html', type);
            
            return td;
        });
        
        return {
            tr: new Element('tr', rowProperties).inject(target || this.body).adopt(tds),
            tds: tds
        };
    }
    
});


/*
 ---
 script: HtmlTable.Zebra.js
 description: Builds a stripy table with methods to add rows.
 license: MIT-style license
 authors:
 - Harald Kirschner
 - Aaron Newton
 requires:
 - /HtmlTable
 - /Class.refactor
 provides: [HtmlTable.Zebra]
 ...
 */
HtmlTable = Class.refactor(HtmlTable, {

    options: {
        classZebra: 'table-tr-odd',
        zebra: true
    },
    
    initialize: function(){
        this.previous.apply(this, arguments);
        if (this.occluded) 
            return this.occluded;
        if (this.options.zebra) 
            this.updateZebras();
    },
    
    updateZebras: function(){
        Array.each(this.body.rows, this.zebra, this);
    },
    
    zebra: function(row, i){
        return row[((i % 2) ? 'remove' : 'add') + 'Class'](this.options.classZebra);
    },
    
    push: function(){
        var pushed = this.previous.apply(this, arguments);
        if (this.options.zebra) 
            this.updateZebras();
        return pushed;
    }
    
});

/*
 ---
 script: Mask.js
 description: Creates a mask element to cover another.
 license: MIT-style license
 authors:
 - Aaron Newton
 requires:
 - core:1.2.4/Options
 - core:1.2.4/Events
 - core:1.2.4/Element.Event
 - /Class.Binds
 - /Element.Position
 - /IframeShim
 provides: [Mask]
 ...
 */
var Mask = new Class({

    Implements: [Options, Events],
    
    Binds: ['position'],
    
    options: {
        // onShow: $empty,
        // onHide: $empty,
        // onDestroy: $empty,
        // onClick: $empty,
        //inject: {
        //  where: 'after',
        //  target: null,
        //},
        // hideOnClick: false,
        // id: null,
        // destroyOnHide: false,
        style: {},
        'class': 'mask',
        maskMargins: false,
        useIframeShim: true,
        iframeShimOptions: {}
    },
    
    initialize: function(target, options){
        this.target = document.id(target) || document.id(document.body);
        this.target.store('Mask', this);
        this.setOptions(options);
        this.render();
        this.inject();
    },
    
    render: function(){
        this.element = new Element('div', {
            'class': this.options['class'],
            id: this.options.id || 'mask-' + $time(),
            styles: $merge(this.options.style, {
                display: 'none'
            }),
            events: {
                click: function(){
                    this.fireEvent('click');
                    if (this.options.hideOnClick) 
                        this.hide();
                }
.bind(this)
            }
        });
        this.hidden = true;
    },
    
    toElement: function(){
        return this.element;
    },
    
    inject: function(target, where){
        where = where || this.options.inject ? this.options.inject.where : '' || this.target == document.body ? 'inside' : 'after';
        target = target || this.options.inject ? this.options.inject.target : '' || this.target;
        this.element.inject(target, where);
        if (this.options.useIframeShim) {
            this.shim = new IframeShim(this.element, this.options.iframeShimOptions);
            this.addEvents({
                show: this.shim.show.bind(this.shim),
                hide: this.shim.hide.bind(this.shim),
                destroy: this.shim.destroy.bind(this.shim)
            });
        }
    },
    
    position: function(){
        this.resize(this.options.width, this.options.height);
        this.element.position({
            relativeTo: this.target,
            position: 'topLeft',
            ignoreMargins: !this.options.maskMargins,
            ignoreScroll: this.target == document.body
        });
        return this;
    },
    
    resize: function(x, y){
        var opt = {
            styles: ['padding', 'border']
        };
        if (this.options.maskMargins) 
            opt.styles.push('margin');
        var dim = this.target.getComputedSize(opt);
        if (this.target == document.body) {
            var win = window.getSize();
            if (dim.totalHeight < win.y) 
                dim.totalHeight = win.y;
            if (dim.totalWidth < win.x) 
                dim.totalWidth = win.x;
        }
        this.element.setStyles({
            width: $pick(x, dim.totalWidth, dim.x),
            height: $pick(y, dim.totalHeight, dim.y)
        });
        return this;
    },
    
    show: function(){
        if (!this.hidden) 
            return this;
        window.addEvent('resize', this.position);
        this.position();
        this.showMask.apply(this, arguments);
        return this;
    },
    
    showMask: function(){
        this.element.setStyle('display', 'block');
        this.hidden = false;
        this.fireEvent('show');
    },
    
    hide: function(){
        if (this.hidden) 
            return this;
        window.removeEvent('resize', this.position);
        this.hideMask.apply(this, arguments);
        if (this.options.destroyOnHide) 
            return this.destroy();
        return this;
    },
    
    hideMask: function(){
        this.element.setStyle('display', 'none');
        this.hidden = true;
        this.fireEvent('hide');
    },
    
    toggle: function(){
        this[this.hidden ? 'show' : 'hide']();
    },
    
    destroy: function(){
        this.hide();
        this.element.destroy();
        this.fireEvent('destroy');
        this.target.eliminate('mask');
    }
    
});

Element.Properties.mask = {

    set: function(options){
        var mask = this.retrieve('mask');
        return this.eliminate('mask').store('mask:options', options);
    },
    
    get: function(options){
        if (options || !this.retrieve('mask')) {
            if (this.retrieve('mask')) 
                this.retrieve('mask').destroy();
            if (options || !this.retrieve('mask:options')) 
                this.set('mask', options);
            this.store('mask', new Mask(this, this.retrieve('mask:options')));
        }
        return this.retrieve('mask');
    }
    
};

Element.implement({

    mask: function(options){
        this.get('mask', options).show();
        return this;
    },
    
    unmask: function(){
        this.get('mask').hide();
        return this;
    }
    
});

/*
 ---
 script: Spinner.js
 description: Adds a semi-transparent overlay over a dom element with a spinnin ajax icon.
 license: MIT-style license
 authors:
 - Aaron Newton
 requires:
 - core:1.2.4/Fx.Tween
 - /Class.refactor
 - /Mask
 provides: [Spinner]
 ...
 */
var Spinner = new Class({

    Extends: Mask,
    
    options: {
        /*message: false,*/
        'class': 'spinner',
        containerPosition: {},
        content: {
            'class': 'spinner-content'
        },
        messageContainer: {
            'class': 'spinner-msg'
        },
        img: {
            'class': 'spinner-img'
        },
        fxOptions: {
            link: 'chain'
        }
    },
    
    initialize: function(){
        this.parent.apply(this, arguments);
        this.target.store('spinner', this);
        
        //add this to events for when noFx is true; parent methods handle hide/show
        var deactivate = function(){
            this.active = false;
        }
.bind(this);
        this.addEvents({
            hide: deactivate,
            show: deactivate
        });
    },
    
    render: function(){
        this.parent();
        this.element.set('id', this.options.id || 'spinner-' + $time());
        this.content = document.id(this.options.content) || new Element('div', this.options.content);
        this.content.inject(this.element);
        if (this.options.message) {
            this.msg = document.id(this.options.message) || new Element('p', this.options.messageContainer).appendText(this.options.message);
            this.msg.inject(this.content);
        }
        if (this.options.img) {
            this.img = document.id(this.options.img) || new Element('div', this.options.img);
            this.img.inject(this.content);
        }
        this.element.set('tween', this.options.fxOptions);
    },
    
    show: function(noFx){
        if (this.active) 
            return this.chain(this.show.bind(this));
        if (!this.hidden) {
            this.callChain.delay(20, this);
            return this;
        }
        this.active = true;
        return this.parent(noFx);
    },
    
    showMask: function(noFx){
        var pos = function(){
            this.content.position($merge({
                relativeTo: this.element
            }, this.options.containerPosition));
        }
.bind(this);
        if (noFx) {
            this.parent();
            pos();
        }
        else {
            this.element.setStyles({
                display: 'block',
                opacity: 0
            }).tween('opacity', this.options.style.opacity || 0.9);
            pos();
            this.hidden = false;
            this.fireEvent('show');
            this.callChain();
        }
    },
    
    hide: function(noFx){
        if (this.active) 
            return this.chain(this.hide.bind(this));
        if (this.hidden) {
            this.callChain.delay(20, this);
            return this;
        }
        this.active = true;
        return this.parent(noFx);
    },
    
    hideMask: function(noFx){
        if (noFx) 
            return this.parent();
        this.element.tween('opacity', 0).get('tween').chain(function(){
            this.element.setStyle('display', 'none');
            this.hidden = true;
            this.fireEvent('hide');
            this.callChain();
        }
.bind(this));
    },
    
    destroy: function(){
        this.content.destroy();
        this.parent();
        this.target.eliminate('spinner');
    }
    
});

Spinner.implement(new Chain);

if (window.Request) {
    Request = Class.refactor(Request, {
    
        options: {
            useSpinner: false,
            spinnerOptions: {},
            spinnerTarget: false
        },
        
        initialize: function(options){
            this._send = this.send;
            this.send = function(options){
                if (this.spinner) 
                    this.spinner.chain(this._send.bind(this, options)).show();
                else 
                    this._send(options);
                return this;
            };
            this.previous(options);
            var update = document.id(this.options.spinnerTarget) || document.id(this.options.update);
            if (this.options.useSpinner && update) {
                this.spinner = update.get('spinner', this.options.spinnerOptions);
                ['onComplete', 'onException', 'onCancel'].each(function(event){
                    this.addEvent(event, this.spinner.hide.bind(this.spinner));
                }, this);
            }
        },
        
        getSpinner: function(){
            return this.spinner;
        }
        
    });
}

Element.Properties.spinner = {

    set: function(options){
        var spinner = this.retrieve('spinner');
        return this.eliminate('spinner').store('spinner:options', options);
    },
    
    get: function(options){
        if (options || !this.retrieve('spinner')) {
            if (this.retrieve('spinner')) 
                this.retrieve('spinner').destroy();
            if (options || !this.retrieve('spinner:options')) 
                this.set('spinner', options);
            new Spinner(this, this.retrieve('spinner:options'));
        }
        return this.retrieve('spinner');
    }
    
};

Element.implement({

    spin: function(options){
        this.get('spinner', options).show();
        return this;
    },
    
    unspin: function(){
        var opt = Array.link(arguments, {
            options: Object.type,
            callback: Function.type
        });
        this.get('spinner', opt.options).hide(opt.callback);
        return this;
    }
    
});
