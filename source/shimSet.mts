// @ts-expect-error no types
import differenceShim from "set.prototype.difference/shim";
// @ts-expect-error no types
import intersectionShim from "set.prototype.intersection/shim";
// @ts-expect-error no types
import unionShim from "set.prototype.union/shim";
// @ts-expect-error no types
import isSubsetOfShim from "set.prototype.isSubsetOf/shim";
// @ts-expect-error no types
import isSupersetOfShim from "set.prototype.isSupersetOf/shim";
// @ts-expect-error no types
import isDisjointFromShim from "set.prototype.isdisjointfrom/shim";
// @ts-expect-error no types
import symmetricdifference from "set.prototype.symmetricdifference/shim";


declare global {
    interface Set<T> {
        /**
         * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/difference | MDN Web Docs: Set.prototype.difference}
         */
        difference(otherSet: Set<T>): Set<T>;
        /**
         * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/intersection | MDN Web Docs: Set.prototype.intersection}
         */
        intersection(otherSet: Set<T>): Set<T>;
        /**
         * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/union | MDN Web Docs: Set.prototype.union}
         */
        union(otherSet: Set<T>): Set<T>;
        /**
         * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSubsetOf | MDN Web Docs: Set.prototype.isSubsetOf}
         */
        isSubsetOf(otherSet: Set<T>): boolean;
        /**
         * {@linkhttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSupersetOf | MDN Web Docs: Set.prototype.isSupersetOf}
         */
        isSupersetOf(otherSet: Set<T>): boolean;
        /**
         * {@link hhttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isDisjointFrom | MDN Web Docs: Set.prototype.isDisjointFrom}
         */
        isDisjointFrom(otherSet: Set<T>): boolean;
        /**
         * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/symmetricDifference | MDN Web Docs: Set.prototype.symmetricDifference}
         */
        symmetricDifference(otherSet: Set<T>): Set<T>;
    }
}

differenceShim();
intersectionShim();
unionShim();
isSubsetOfShim();
isSupersetOfShim();
isDisjointFromShim();
symmetricdifference();

