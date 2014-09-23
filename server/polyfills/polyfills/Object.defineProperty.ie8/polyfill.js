// Object.defineProperty
(function () {
	var defineProperty = Object.defineProperty;
    // In Internet Explorer 8 Object.defineProperty only accepts DOM objects
    // otherwise it throws an error
	Object.defineProperty = function (object, property, descriptor) {
		delete descriptor.configurable;
		delete descriptor.enumerable;
		delete descriptor.writable;
        try {
            return defineProperty(object, property, descriptor);
        }
        catch(err) {
            (property in object) || (object[property]=descriptor.value);
        }
	};
})();
