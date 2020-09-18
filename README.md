# Welcome to Closed Continuous Bézier Curves (recalculated).

This repo is a mess because it is preliminary.
Collecting and constructing materials, documentation, and samples.

A continuous Bézier curve is a composite curve (multiple consecutive smaller curves) that at the seams share an identical first and second derivatives.
The general issue is that implementations consider it "open", meaning that the smaller curves are independent/non-connected.
Control points are machine generated and far from intuitive.
Attempts to manually change the curve usually end in distorting the whole.

Sample:

[![Animated](docs/animated.gif)](https://RockingShip.github.io/ccbc/animated.html)

[![Resize](docs/resize.png)](https://RockingShip.github.io/ccbc/resize.html)

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
