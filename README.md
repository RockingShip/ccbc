# Welcome to Closed Continuous Bézier Curves (recalculated).

This repo is a mess because it is preliminary.
Collecting and constructing materials, documentation and samples.

A continuous Bézier curve is a composite curve (multiple consecutive smaller curves) that at the seams share an identical first and second derivatives.
The general issue is that implementations consider it "open", meaning that the sections of the curves are independent/non-connected.
Control points are mostly machine generated and far from intuitive.
Attempts to manually change the curve usually ends in distorting the whole.

This project takes a new approach to Bezier curves considering all sections connected (closed curve).
Maths drastically simplify, creating B/C control points for plotting is a linear function (instead of matrix solving).
Intuitive human/curve interaction, control points are no longer off-curve but are actually located on the curve.
Ultra high speed plotting allows for real-time fitting of curves onto contours (represented as a vector of coordinates).

Samples: (Click image to open interactive version)

[![Animated](docs/animated.gif)](https://RockingShip.github.io/ccbc/animated.html)
Basic bezier with on-curve control points.

[![Compare](docs/compare.gif)](https://RockingShip.github.io/ccbc/compare.html)
Compare between Bezier curve and coordinate vector.

[![Resize](docs/resize.png)](https://RockingShip.github.io/ccbc/resize.html)
Bezier curve with dynamic number of composite sections.

# Requirements

*   mootools for DOM/javascript connectivity (included)

# Installation

This is a self supporting repository and has no explicit build instructions.

# Versioning

Using [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/RockingShip/ccbc/tags).

# License

This project is licensed under the GNU AFFERO General Public License v3 - see the [LICENSE.txt](LICENSE.txt) file for details

## Acknowledgments

* Pierre Étienne Bézier and his amazing work on what is now known as Bézier curves.
