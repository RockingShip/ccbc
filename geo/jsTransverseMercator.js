/**
 * \file TransverseMercatorProj.cpp
 * \brief Command line utility for transverse Mercator projections
 *
 * Copyright (c) Charles Karney (2008-2017) <charles@karney.com> and licensed
 * under the MIT/X11 License.  For more information, see
 * https://geographiclib.sourceforge.io/
 *
 * See the <a href="TransverseMercatorProj.1.html">man page</a> for usage information.
 **/

"use strict";

function EllipticFunction(k2, alpha2) {

	this.num_ = 13; // Max depth required for sncndn; probably 5 is enough.
	this._Kc = 0;
	this._kp2 = 0;
	this._alpha2 = 0;
	this._alphap2 = 0;
	this._Kc = 0;
	this._Ec = 0;

	/**
	 * \brief Elliptic integrals and functions
	 *
	 * This provides the elliptic functions and integrals needed for Ellipsoid,
	 * GeodesicExact, and TransverseMercatorExact.  Two categories of function
	 * are provided:
	 * - \e static functions to compute symmetric elliptic integrals
	 *   (https://dlmf.nist.gov/19.16.i)
	 * - \e member functions to compute Legrendre's elliptic
	 *   integrals (https://dlmf.nist.gov/19.2.ii) and the
	 *   Jacobi elliptic functions (https://dlmf.nist.gov/22.2).
	 * .
	 * In the latter case, an object is constructed giving the modulus \e k (and
	 * optionally the parameter &alpha;<sup>2</sup>).  The modulus is always
	 * passed as its square <i>k</i><sup>2</sup> which allows \e k to be pure
	 * imaginary (<i>k</i><sup>2</sup> &lt; 0).  (Confusingly, Abramowitz and
	 * Stegun call \e m = <i>k</i><sup>2</sup> the "parameter" and \e n =
	 * &alpha;<sup>2</sup> the "characteristic".)
	 *
	 * In geodesic applications, it is convenient to separate the incomplete
	 * integrals into secular and periodic components, e.g.,
	 * \f[
	 *   E(\phi, k) = (2 E(k) / \pi) [ \phi + \delta E(\phi, k) ]
	 * \f]
	 * where &delta;\e E(&phi;, \e k) is an odd periodic function with period
	 * &pi;.
	 *
	 * The computation of the elliptic integrals uses the algorithms given in
	 * - B. C. Carlson,
	 *   <a href="https://doi.org/10.1007/BF02198293"> Computation of real or
	 *   complex elliptic integrals</a>, Numerical Algorithms 10, 13--26 (1995)
	 * .
	 * with the additional optimizations given in https://dlmf.nist.gov/19.36.i.
	 * The computation of the Jacobi elliptic functions uses the algorithm given
	 * in
	 * - R. Bulirsch,
	 *   <a href="https://doi.org/10.1007/BF01397975"> Numerical Calculation of
	 *   Elliptic Integrals and Elliptic Functions</a>, Numericshe Mathematik 7,
	 *   78--90 (1965).
	 * .
	 * The notation follows https://dlmf.nist.gov/19 and https://dlmf.nist.gov/22
	 *
	 * Example of use:
	 * \include example-EllipticFunction.cpp
	 **/

	/*
	 * Implementation of methods given in
	 *
	 *   B. C. Carlson
	 *   Computation of elliptic integrals
	 *   Numerical Algorithms 10, 13-26 (1995)
	 */

	/**
	 * Symmetric integral of the first kind <i>R</i><sub><i>F</i></sub>.
	 *
	 * @param[in] x
	 * @param[in] y
	 * @param[in] z
	 * @return <i>R</i><sub><i>F</i></sub>(\e x, \e y, \e z).
	 *
	 * <i>R</i><sub><i>F</i></sub> is defined in https://dlmf.nist.gov/19.16.E1
	 * \f[ R_F(x, y, z) = \frac12
	 *       \int_0^\infty\frac1{\sqrt{(t + x) (t + y) (t + z)}}\, dt \f]
	 * If one of the arguments is zero, it is more efficient to call the
	 * two-argument version of this function with the non-zero arguments.
	 *
	 * Implementation of methods given in
	 *
	 *   B. C. Carlson
	 *   Computation of elliptic integrals
	 *   Numerical Algorithms 10, 13-26 (1995)
	 **/
	this.RF3 = function RF(x, y, z) {
		// Carlson, eqs 2.2 - 2.7
		const tolRF = Math.pow(3 * Number.EPSILON * 0.01, 1 / 8);
		const A0 = (x + y + z) / 3;
		let An = A0;
		const Q = Math.max(Math.max(Math.abs(A0 - x), Math.abs(A0 - y)), Math.abs(A0 - z)) / tolRF;
		let x0 = x;
		let y0 = y;
		let z0 = z;
		let mul = 1;

		while (Q >= mul * Math.abs(An)) {
			// Max 6 trips
			const lam = Math.sqrt(x0) * Math.sqrt(y0) + Math.sqrt(y0) * Math.sqrt(z0) + Math.sqrt(z0) * Math.sqrt(x0);
			An = (An + lam) / 4;
			x0 = (x0 + lam) / 4;
			y0 = (y0 + lam) / 4;
			z0 = (z0 + lam) / 4;
			mul *= 4;
		}

		const X = (A0 - x) / (mul * An);
		const Y = (A0 - y) / (mul * An);
		const Z = -(X + Y);
		const E2 = X * Y - Z * Z;
		const E3 = X * Y * Z;

		// https://dlmf.nist.gov/19.36.E1
		// Polynomial is
		// (1 - E2/10 + E3/14 + E2^2/24 - 3*E2*E3/44
		//    - 5*E2^3/208 + 3*E3^2/104 + E2^2*E3/16)
		// convert to Horner form...
		return (E3 * (6930 * E3 + E2 * (15015 * E2 - 16380) + 17160) +
			E2 * ((10010 - 5775 * E2) * E2 - 24024) + 240240) /
			(240240 * Math.sqrt(An));
	}

	/**
	 * Complete symmetric integral of the first kind,
	 * <i>R</i><sub><i>F</i></sub> with one argument zero.
	 *
	 * @param[in] x
	 * @param[in] y
	 * @return <i>R</i><sub><i>F</i></sub>(\e x, \e y, 0).
	 **/
	this.RF2 = function (x, y) {
		// Carlson, eqs 2.36 - 2.38
		const tolRG0 = 2.7 * Math.sqrt((Number.EPSILON * 0.01));
		let xn = Math.sqrt(x);
		let yn = Math.sqrt(y);
		if (xn < yn) {
			//swap
			const tmp = xn;
			xn = yn;
			yn = tmp;
		}
		while (Math.abs(xn - yn) > tolRG0 * xn) {
			// Max 4 trips
			const t = (xn + yn) / 2;
			yn = Math.sqrt(xn * yn);
			xn = t;
		}
		return Math.PI / (xn + yn);
	}

	/**
	 * Complete symmetric integral of the second kind,
	 * <i>R</i><sub><i>G</i></sub> with one argument zero.
	 *
	 * @param[in] x
	 * @param[in] y
	 * @return <i>R</i><sub><i>G</i></sub>(\e x, \e y, 0).
	 **/
	this.RG2 = function (x, y) {
		// Carlson, eqs 2.36 - 2.39
		const tolRG0 = 2.7 * Math.sqrt(Number.EPSILON * 0.01);
		const x0 = Math.sqrt(Math.max(x, y));
		const y0 = Math.sqrt(Math.min(x, y));
		let xn = x0;
		let yn = y0;
		let s = 0;
		let mul = 0.25;

		while (Math.abs(xn - yn) > tolRG0 * xn) {
			// Max 4 trips
			let t = (xn + yn) / 2;
			yn = Math.sqrt(xn * yn);
			xn = t;
			mul *= 2;
			t = xn - yn;
			s += mul * t * t;
		}
		return ((((x0 + y0) / 2) * ((x0 + y0) / 2)) - s) * Math.PI / (2 * (xn + yn));
	}

	/**
	 * Degenerate symmetric integral of the third kind
	 * <i>R</i><sub><i>D</i></sub>.
	 *
	 * @param[in] x
	 * @param[in] y
	 * @param[in] z
	 * @return <i>R</i><sub><i>D</i></sub>(\e x, \e y, \e z) =
	 *   <i>R</i><sub><i>J</i></sub>(\e x, \e y, \e z, \e z).
	 *
	 * <i>R</i><sub><i>D</i></sub> is defined in https://dlmf.nist.gov/19.16.E5
	 * \f[ R_D(x, y, z) = \frac32
	 *       \int_0^\infty[(t + x) (t + y)]^{-1/2} (t + z)^{-3/2}\, dt \f]
	 **/
	this.RD3 = function (x, y, z) {
		// Carlson, eqs 2.28 - 2.34
		const tolRD = Math.pow(0.2 * (Number.EPSILON * 0.01), 1 / 8);
		const A0 = (x + y + 3 * z) / 5;
		let An = A0;
		const Q = Math.max(Math.max(Math.abs(A0 - x), Math.abs(A0 - y)), Math.abs(A0 - z)) / tolRD;
		let x0 = x;
		let y0 = y;
		let z0 = z;
		let mul = 1;
		let s = 0;

		while (Q >= mul * Math.abs(An)) {
			// Max 7 trips
			const lam = Math.sqrt(x0) * Math.sqrt(y0) + Math.sqrt(y0) * Math.sqrt(z0) + Math.sqrt(z0) * Math.sqrt(x0);

			s += 1 / (mul * Math.sqrt(z0) * (z0 + lam));
			An = (An + lam) / 4;
			x0 = (x0 + lam) / 4;
			y0 = (y0 + lam) / 4;
			z0 = (z0 + lam) / 4;
			mul *= 4;
		}

		const X = (A0 - x) / (mul * An);
		const Y = (A0 - y) / (mul * An);
		const Z = -(X + Y) / 3;
		const E2 = X * Y - 6 * Z * Z;
		const E3 = (3 * X * Y - 8 * Z * Z) * Z;
		const E4 = 3 * (X * Y - Z * Z) * Z * Z;
		const E5 = X * Y * Z * Z * Z;

		// https://dlmf.nist.gov/19.36.E2
		// Polynomial is
		// (1 - 3*E2/14 + E3/6 + 9*E2^2/88 - 3*E4/22 - 9*E2*E3/52 + 3*E5/26
		//    - E2^3/16 + 3*E3^2/40 + 3*E2*E4/20 + 45*E2^2*E3/272
		//    - 9*(E3*E4+E2*E5)/68)
		return ((471240 - 540540 * E2) * E5 +
			(612612 * E2 - 540540 * E3 - 556920) * E4 +
			E3 * (306306 * E3 + E2 * (675675 * E2 - 706860) + 680680) +
			E2 * ((417690 - 255255 * E2) * E2 - 875160) + 4084080) /
			(4084080 * mul * An * Math.sqrt(An)) + 3 * s;
	}

	/**
	 * Reset the modulus and parameter supplying also their complements.
	 *
	 * @param[in] k2 the square of the modulus <i>k</i><sup>2</sup>.
	 *   <i>k</i><sup>2</sup> must lie in (&minus;&infin;, 1].
	 * @param[in] alpha2 the parameter &alpha;<sup>2</sup>.
	 *   &alpha;<sup>2</sup> must lie in (&minus;&infin;, 1].
	 * @param[in] kp2 the complementary modulus squared <i>k'</i><sup>2</sup> =
	 *   1 &minus; <i>k</i><sup>2</sup>.  This must lie in [0, &infin;).
	 * @param[in] alphap2 the complementary parameter &alpha;'<sup>2</sup> = 1
	 *   &minus; &alpha;<sup>2</sup>.  This must lie in [0, &infin;).
	 * @exception GeographicErr if \e k2, \e alpha2, \e kp2, or \e alphap2 is
	 *   out of its legal range.
	 *
	 * The arguments must satisfy \e k2 + \e kp2 = 1 and \e alpha2 + \e alphap2
	 * = 1.  (No checking is done that these conditions are met.)  This
	 * constructor is provided to enable accuracy to be maintained, e.g., when
	 * is very small.
	 **/
	this.reset = function (k2, alpha2, kp2, alphap2) {
		// Accept nans here (needed for GeodesicExact)
		if (k2 > 1)
			throw new Error("Parameter k2 is not in (-inf, 1]");
		if (alpha2 > 1)
			throw new Error("Parameter alpha2 is not in (-inf, 1]");
		if (kp2 < 0)
			throw new Error("Parameter kp2 is not in [0, inf)");
		if (alphap2 < 0)
			throw new Error("Parameter alphap2 is not in [0, inf)");

		this._k2 = k2;
		this._kp2 = kp2;
		this._alpha2 = alpha2;
		this._alphap2 = alphap2;
		this._k2 / ((Math.sqrt(this._kp2) + 1) * (Math.sqrt(this._kp2) + 1));

		// Values of complete elliptic integrals for k = 0,1 and alpha = 0,1
		//         K     E     D
		// k = 0:  pi/2  pi/2  pi/4
		// k = 1:  inf   1     inf
		//                    Pi    G     H
		// k = 0, alpha = 0:  pi/2  pi/2  pi/4
		// k = 1, alpha = 0:  inf   1     1
		// k = 0, alpha = 1:  inf   inf   pi/2
		// k = 1, alpha = 1:  inf   inf   inf
		//
		// Pi(0, k) = K(k)
		// G(0, k) = E(k)
		// H(0, k) = K(k) - D(k)
		// Pi(0, k) = K(k)
		// G(0, k) = E(k)
		// H(0, k) = K(k) - D(k)
		// Pi(alpha2, 0) = pi/(2*sqrt(1-alpha2))
		// G(alpha2, 0) = pi/(2*sqrt(1-alpha2))
		// H(alpha2, 0) = pi/(2*(1 + sqrt(1-alpha2)))
		// Pi(alpha2, 1) = inf
		// H(1, k) = K(k)
		// G(alpha2, 1) = H(alpha2, 1) = RC(1, alphap2)
		if (this._k2 !== 0) {
			// Complete elliptic integral K(k), Carlson eq. 4.1
			// https://dlmf.nist.gov/19.25.E1
			this._Kc = this._kp2 !== 0 ? this.RF2(this._kp2, 1) : Number.MAX_VALUE;
			// Complete elliptic integral E(k), Carlson eq. 4.2
			// https://dlmf.nist.gov/19.25.E1
			this._Ec = this._kp2 !== 0 ? 2 * this.RG2(this._kp2, 1) : 1;
			// D(k) = (K(k) - E(k))/k^2, Carlson eq.4.3
			// https://dlmf.nist.gov/19.25.E1
			this._kp2 !== 0 ? this.RD3(0, this._kp2, 1) / 3 : Number.MAX_VALUE;
		} else {
			this._Kc = this._Ec = Math.PI / 2;
		}
		if (this._alpha2 !== 0) {
			// https://dlmf.nist.gov/19.25.E2
			const rj = (this._kp2 !== 0 && this._alphap2 !== 0) ? this.RJ(0, this._kp2, 1, this._alphap2) :
				Number.MAX_VALUE,
				// Only use rc if _kp2 = 0.
				rc = this._kp2 !== 0 ? 0 : (this._alphap2 !== 0 ? this.RC(1, this._alphap2) : Number.MAX_VALUE);
			// Pi(alpha^2, k)
			this._kp2 !== 0 ? this._Kc + this._alpha2 * rj / 3 : Number.MAX_VALUE;
			// G(alpha^2, k)
			// H(alpha^2, k)
		} else {
			// Hc = Kc - Dc but this involves large cancellations if k2 is close to
			// 1.  So write (for alpha2 = 0)
			//   Hc = int(cos(phi)^2/sqrt(1-k2*sin(phi)^2),phi,0,pi/2)
			//      = 1/sqrt(1-k2) * int(sin(phi)^2/sqrt(1-k2/kp2*sin(phi)^2,...)
			//      = 1/kp * D(i*k/kp)
			// and use D(k) = RD(0, kp2, 1) / 3
			// so Hc = 1/kp * RD(0, 1/kp2, 1) / 3
			//       = kp2 * RD(0, 1, kp2) / 3
			// using https://dlmf.nist.gov/19.20.E18
			// Equivalently
			//   RF(x, 1) - RD(0, x, 1)/3 = x * RD(0, 1, x)/3 for x > 0
			// For k2 = 1 and alpha2 = 0, we have
			//   Hc = int(cos(phi),...) = 1
			this._kp2 !== 0 ? this._kp2 * this.RD3(0, 1, this._kp2) / 3 : 1;
		}
	}

	/**
	 * The complete integral of the first kind.
	 *
	 * @return \e K(\e k).
	 *
	 * \e K(\e k) is defined in https://dlmf.nist.gov/19.2.E4
	 * \f[
	 *   K(k) = \int_0^{\pi/2} \frac1{\sqrt{1-k^2\sin^2\phi}}\,d\phi.
	 * \f]
	 **/
	this.K = function () {
		return this._Kc;
	}

	/*
	 * Implementation of methods given in
	 *
	 *   R. Bulirsch
	 *   Numerical Calculation of Elliptic Integrals and Elliptic Functions
	 *   Numericshe Mathematik 7, 78-90 (1965)
	 */

	/**
	 * The Jacobi elliptic functions.
	 *
	 * @param[in] x the argument.
	 * @param[out] sn sn(\e x, \e k).
	 * @param[out] cn cn(\e x, \e k).
	 * @param[out] dn dn(\e x, \e k).
	 **/
	this.sncndn = function (x) {
		// Bulirsch's sncndn routine, p 89.
		const tolJAC = Math.sqrt(Number.EPSILON * 0.01);

		let sn, cn, dn;

		if (this._kp2 !== 0) {
			let mc = this._kp2, d = 0;
			if (this._kp2 < 0) {
				d = 1 - mc;
				mc /= -d;
				d = Math.sqrt(d);
				x *= d;
			}

			let c = 0;
			let m = [];
			let n = [];
			m.length = n.length = this.num_;

			let l = 0;
			for (let a = 1; l < this.num_; ++l) {
				// This converges quadratically.  Max 5 trips
				m[l] = a;
				n[l] = mc = Math.sqrt(mc);
				c = (a + mc) / 2;
				if (!(Math.abs(a - mc) > tolJAC * a)) {
					++l;
					break;
				}
				mc *= a;
				a = c;
			}

			x *= c;

			sn = Math.sin(x);
			cn = Math.cos(x);
			dn = 1;

			if (sn !== 0) {
				let a = cn / sn;
				c *= a;
				while (l--) {
					let b = m[l];
					a *= c;
					c *= dn;
					dn = (n[l] + a) / (b + a);
					a = c / b;
				}
				a = 1 / Math.sqrt(c * c + 1);
				sn = sn < 0 ? -a : a;
				cn = c * sn;
				if (this._kp2 < 0) {
					{
						// swap
						let tmp = cn;
						cn = dn;
						dn = tmp;
					}
					sn /= d;
				}
			}
		} else {
			sn = Math.tanh(x);
			dn = cn = 1 / Math.cosh(x);
		}

		return {sn: sn, cn: cn, dn: dn};
	}

	/**
	 * The complete integral of the second kind.
	 *
	 * @return \e E(\e k).
	 *
	 * \e E(\e k) is defined in https://dlmf.nist.gov/19.2.E5
	 * \f[
	 *   E(k) = \int_0^{\pi/2} \sqrt{1-k^2\sin^2\phi}\,d\phi.
	 * \f]
	 **/
	this.E0 = function () {
		return this._Ec;
	}

	/**
	 * The incomplete integral of the second kind in terms of Jacobi elliptic functions.
	 *
	 * @param[in] sn = sin&phi;.
	 * @param[in] cn = cos&phi;.
	 * @param[in] dn = sqrt(1 &minus; <i>k</i><sup>2</sup>
	 *   sin<sup>2</sup>&phi;).
	 * @return \e E(&phi;, \e k) as though &phi; &isin; (&minus;&pi;, &pi;].
	 **/
	this.E3 = function (sn, cn, dn) {
		let cn2 = cn * cn;
		let dn2 = dn * dn;
		let sn2 = sn * sn;

		let ei = cn2 !== 0 ?
			Math.abs(sn) * (this._k2 <= 0 ?
			// Carlson, eq. 4.6 and
			// https://dlmf.nist.gov/19.25.E9
			this.RF3(cn2, dn2, 1) - this._k2 * sn2 * this.RD3(cn2, dn2, 1) / 3 :
			(this._kp2 >= 0 ?
				// https://dlmf.nist.gov/19.25.E10
				this._kp2 * this.RF3(cn2, dn2, 1) +
				this._k2 * this._kp2 * sn2 * this.RD3(cn2, 1, dn2) / 3 +
				this._k2 * Math.abs(cn) / dn :
				// https://dlmf.nist.gov/19.25.E11
				-this._kp2 * sn2 * this.RD3(dn2, 1, cn2) / 3 +
				dn / Math.abs(cn))) :
			this.E0();
		// Enforce usual trig-like symmetries
		if (cn < 0)
			ei = 2 * this.E0() - ei;

		return (Math.sign(sn) > 0) ? Math.abs(ei) : -Math.abs(ei);
	}

	/**
	 * The difference between the complete integrals of the first and second
	 * kinds.
	 *
	 * @return \e K(\e k) &minus; \e E(\e k).
	 **/
	this.KE = function() {
		return this._k2 * this._Dc;
	}

	/**
	 * Constructor specifying the modulus and parameter.
	 *
	 * @param[in] k2 the square of the modulus <i>k</i><sup>2</sup>.
	 *   <i>k</i><sup>2</sup> must lie in (&minus;&infin;, 1].
	 * @param[in] alpha2 the parameter &alpha;<sup>2</sup>.
	 *   &alpha;<sup>2</sup> must lie in (&minus;&infin;, 1].
	 * @exception GeographicErr if \e k2 or \e alpha2 is out of its legal
	 *   range.
	 *
	 * If only elliptic integrals of the first and second kinds are needed,
	 * then set &alpha;<sup>2</sup> = 0 (the default value); in this case, we
	 * have &Pi;(&phi;, 0, \e k) = \e F(&phi;, \e k), \e G(&phi;, 0, \e k) = \e
	 * E(&phi;, \e k), and \e H(&phi;, 0, \e k) = \e F(&phi;, \e k) - \e
	 * D(&phi;, \e k).
	 **/
	{
		if (!k2)
			k2 = 0;
		if (!alpha2)
			alpha2 = 0;
		this.reset(k2, alpha2, 1 - k2, 1 - alpha2);
	}
}

function TransverseMercator(k0, a, f) {

	/**
	 * @return the number of meters in a meter.
	 *
	 * This is unity, but this lets the internal system of units be changed if necessary.
	 **/
	this.meter = function () {
		return 1;
	};

	/**
	 * @return the number of radians in a degree.
	 **/
	this.degree = function () {
		return Math.PI / 180;
	};

	/**
	 * @return the equatorial radius of WGS84 ellipsoid (6378137 m).
	 **/
	this.WGS84_a = function () {
		return 6378137 * this.meter();
	};

	/**
	 * @return the flattening of WGS84 ellipsoid (1/298.257223563).
	 **/
	this.WGS84_f = function () {
		// Evaluating this as 1000000000 / 298257223563LL reduces the round-off error by about 10%.
		// However, expressing the flattening as 1/298.257223563 is well ingrained.
		return 1 / (298257223563 / 1000000000);
	};

	/**
	 * @return the central scale factor for UTM (0.9996).
	 **/
	this.UTM_k0 = function () {
		return 9996 / 10000;
	};

	this.numit_ = 10;
	this.tol_ = Number.EPSILON;
	this.tol2_ = 0.1 * this.tol_;
	this.taytol_ = Math.pow(this.tol_, 0.6);
	this._a = a ? a : this.WGS84_a();
	this._f = f ? f : this.WGS84_f();
	this._k0 = k0 ? k0 : this.UTM_k0();
	this._mu = this._f * (2 - this._f);
	this._mv = 1 - this._mu;
	this._e = Math.sqrt(this._mu);
	this._Eu = new EllipticFunction(this._mu);
	this._Ev = new EllipticFunction(this._mv);
	this._extendp = false;

	/*
	 * Mathematical functions
	 *
	 * Define mathematical functions in order to localize system dependencies and
	 * to provide generic versions of the functions.  In addition define a real
	 * type to be used by %GeographicLib.
	 */

	/**
	 * The remainder function.
	 *
	 * @param[in] x
	 * @param[in] y
	 * @return the remainder of \e x/\e y in the range [&minus;\e y/2, \e y/2].
	 **/
	this.remainder = function (x, y) {
		y = Math.abs(y); // The result doesn't depend on the sign of y
		let z = x % y;

		if (2 * Math.abs(z) === y)
			z -= x % (2 * y) - z; // Implement ties to even
		else if (2 * Math.abs(z) > y)
			z += (z < 0 ? y : -y);  // Fold remaining cases to (-y/2, y/2)
		return z;
	};

	/**
	 * The remquo function.
	 *
	 * @param[in] x
	 * @param[in] y
	 * @param[out] n the low 3 bits of the quotient
	 * @return the remainder of \e x/\e y in the range [&minus;\e y/2, \e y/2].
	 **/
	this.remquo = function (x, y) {
		let n;
		let z = this.remainder(x, y);
		let a = this.remainder(x, 2 * y);
		let b = this.remainder(x, 4 * y);
		let c = this.remainder(x, 8 * y);

		n = (a > z ? 1 : (a < z ? -1 : 0));
		n += (b > a ? 2 : (b < a ? -2 : 0));
		n += (c > b ? 4 : (c < b ? -4 : 0));

		if (y < 0)
			n = -n;
		if (y !== 0) {
			if (x / y > 0 && n <= 0)
				n += 8;
			else if (x / y < 0 && n >= 0)
				n -= 8;
		}
		return {rem: z, quo: n};
	};

	/**
	 * The error-free sum of two numbers.
	 *
	 * @param[in] u
	 * @param[in] v
	 * @param[out] t the exact error given by (\e u + \e v) - \e s.
	 * @return \e s = round(\e u + \e v).
	 *
	 * See D. E. Knuth, TAOCP, Vol 2, 4.2.2, Theorem B.  (Note that \e t can be
	 * the same as one of the first two arguments.)
	 **/
	this.sum = function (u, v) {
		const s = u + v;
		let up = s - v;
		let vpp = s - up;

		up -= u;
		vpp -= v;
		const t = -(up + vpp);

		// u + v =       s      + t
		//       = round(u + v) + t
		return {s: s, t: t};
	};

	/**
	 * Normalize an angle.
	 *
	 * @param x the angle in degrees.
	 * @return the angle reduced to the range (&minus;180&deg;, 180&deg;].
	 *
	 * The range of \e x is unrestricted.
	 **/
	this.angNormalize = function (x) {
		x = this.remainder(x, 360);
		return x !== -180 ? x : 180;
	};

	/**
	 * Normalize a latitude.
	 *
	 * @param x the angle in degrees.
	 * @return x if it is in the range [&minus;90&deg;, 90&deg;], otherwise return NaN.
	 **/
	this.latFix = function (x) {
		return Math.abs(x) > 90 ? Number.NaN : x;
	};

	/*
	 * The exact difference of two angles reduced to (&minus;180&deg;, 180&deg;].
	 *
	 * @param x the first angle in degrees.
	 * @param y the second angle in degrees.
	 * @return \e d, the truncated value of \e y &minus; \e x.
	 * @return \e e the error term in degrees.
	 *
	 * This computes \e z = \e y &minus; \e x exactly, reduced to
	 * (&minus;180&deg;, 180&deg;]; and then sets \e z = \e d + \e e where \e d
	 * is the nearest representable number to \e z and \e e is the truncation
	 * error.  If \e d = &minus;180, then \e e &gt; 0; If \e d = 180, then \e e
	 * &le; 0.
	 */
	this.angDiff = function (x, y) {
		const {s: s, t: t} = this.sum(this.remainder(-x, 360), this.remainder(y, 360));
		const d = this.angNormalize(s);

		// Here y - x = d + t (mod 360), exactly, where d is in (-180,180] and
		// abs(t) <= eps (eps = 2^-45 for doubles).  The only case where the
		// addition of t takes the result outside the range (-180,180] is d = 180
		// and t > 0.  The case, d = -180 + eps, t = -eps, can't happen, since
		// sum would have returned the exact result in such a case (i.e., given t
		// = 0).
		return this.sum((d === 180 && t > 0) ? -180 : d, t);
	};

	/**
	 * Evaluate the sine and cosine function with the argument in degrees
	 *
	 * @param[in] x in degrees.
	 * @param[out] sinx sin(<i>x</i>).
	 * @param[out] cosx cos(<i>x</i>).
	 *
	 * The results obey exactly the elementary properties of the trigonometric
	 * functions, e.g., sin 9&deg; = cos 81&deg; = &minus; sin 123456789&deg;.
	 * If x = &minus;0, then \e sinx = &minus;0; this is the only case where
	 * &minus;0 is returned.
	 */
	this.sincosd = function (x) {
		// In order to minimize round-off errors, this function exactly reduces
		// the argument to the range [-45, 45] before converting it to radians.

		let {rem: r, quo: q} = this.remquo(x, 90);   // now abs(r) <= 45
		r *= this.degree();

		// g++ -O turns these two function calls into a call to sincos
		const s = Math.sin(r), c = Math.cos(r);

		let sinx, cosx;
		switch (q & 3) {
			case 0:
				sinx = s;
				cosx = c;
				break;
			case 1:
				sinx = c;
				cosx = -s;
				break;
			case 2:
				sinx = -s;
				cosx = -c;
				break;
			default:
				sinx = -c;
				cosx = s;
				break; // case 3
		}

		// Set sign of 0 results.  -0 only produced for sin(-0)
		if (x !== 0) {
			sinx += 0;
			cosx += 0;
		}

		return {sin: sinx, cos: cosx};
	};

	/**
	 * Evaluate the tangent function with the argument in degrees
	 *
	 * @param[in] x in degrees.
	 * @return tan(<i>x</i>).
	 *
	 * If \e x = &plusmn;90&deg;, then a suitably large (but finite) value is
	 * returned.
	 **/
	this.tand = function (x) {
		const overflow = 1 / (Number.EPSILON * Number.EPSILON);
		const {sin: s, cos: c} = this.sincosd(x);
		return c !== 0 ? s / c : (s < 0 ? -overflow : overflow);

	};

	/**
	 * Evaluate <i>e</i> atanh(<i>e x</i>)
	 *
	 * @param[in] x
	 * @param[in] es the signed eccentricity =  sign(<i>e</i><sup>2</sup>)
	 *    sqrt(|<i>e</i><sup>2</sup>|)
	 * @return <i>e</i> atanh(<i>e x</i>)
	 *
	 * If <i>e</i><sup>2</sup> is negative (<i>e</i> is imaginary), the
	 * expression is evaluated in terms of atan.
	 */
	this.eatanhe = function (x, es) {
		return es > 0 ? es * Math.atanh(es * x) : -es * Math.atan(es * x);
	};

	/**
	 * tan&chi; in terms of tan&phi;
	 *
	 * @param[in] tau &tau; = tan&phi;
	 * @param[in] es the signed eccentricity = sign(<i>e</i><sup>2</sup>)
	 *   sqrt(|<i>e</i><sup>2</sup>|)
	 * @return &tau;&prime; = tan&chi;
	 *
	 * See Eqs. (7--9) of
	 * C. F. F. Karney,
	 * <a href="https://doi.org/10.1007/s00190-011-0445-3">
	 * Transverse Mercator with an accuracy of a few nanometers,</a>
	 * J. Geodesy 85(8), 475--485 (Aug. 2011)
	 * (preprint
	 * <a href="https://arxiv.org/abs/1002.1417">arXiv:1002.1417</a>).
	 **/
	this.taupf = function (tau, es) {
		let tau1 = Math.hypot(1, tau);
		let sig = Math.sinh(this.eatanhe(tau / tau1, es));
		return Math.hypot(1, sig) * tau - sig * tau1;
	};

	/**
	 * tan&phi; in terms of tan&chi;
	 *
	 * @param[in] taup &tau;&prime; = tan&chi;
	 * @param[in] es the signed eccentricity = sign(<i>e</i><sup>2</sup>)
	 *   sqrt(|<i>e</i><sup>2</sup>|)
	 * @return &tau; = tan&phi;
	 *
	 * See Eqs. (19--21) of
	 * C. F. F. Karney,
	 * <a href="https://doi.org/10.1007/s00190-011-0445-3">
	 * Transverse Mercator with an accuracy of a few nanometers,</a>
	 * J. Geodesy 85(8), 475--485 (Aug. 2011)
	 * (preprint
	 * <a href="https://arxiv.org/abs/1002.1417">arXiv:1002.1417</a>).
	 **/
	this.tauf = function (taup, es) {
		const numit = 5;
		const tol = Math.sqrt(Number.EPSILON) / 10;
		let e2m = 1 - (es * es);

		// To lowest order in e^2, taup = (1 - e^2) * tau = _e2m * tau; so use
		// tau = taup/_e2m as a starting guess.  (This starting guess is the
		// geocentric latitude which, to first order in the flattening, is equal
		// to the conformal latitude.)  Only 1 iteration is needed for |lat| <
		// 3.35 deg, otherwise 2 iterations are needed.  If, instead, tau = taup
		// is used the mean number of iterations increases to 1.99 (2 iterations
		// are needed except near tau = 0).
		let tau = taup / e2m;
		const stol = tol * Math.max(1, Math.abs(taup));

		// min iterations = 1, max iterations = 2; mean = 1.94
		for (let i = 0; i < numit; ++i) {
			const taupa = this.taupf(tau, es);
			const dtau = (taup - taupa) * (1 + e2m * (tau * tau)) / (e2m * Math.hypot(1, tau) * Math.hypot(1, taupa));
			tau += dtau;
			if (!(Math.abs(dtau) >= stol))
				break;
		}
		return tau;
	};

	/**
	 * \brief An exact implementation of the transverse Mercator projection
	 *
	 * Implementation of the Transverse Mercator Projection given in
	 *  - L. P. Lee,
	 *    <a href="https://doi.org/10.3138/X687-1574-4325-WM62"> Conformal
	 *    Projections Based On Jacobian Elliptic Functions</a>, Part V of
	 *    Conformal Projections Based on Elliptic Functions,
	 *    (B. V. Gutsell, Toronto, 1976), 128pp.,
	 *    ISBN: 0919870163
	 *    (also appeared as:
	 *    Monograph 16, Suppl. No. 1 to Canadian Cartographer, Vol 13).
	 *  - C. F. F. Karney,
	 *    <a href="https://doi.org/10.1007/s00190-011-0445-3">
	 *    Transverse Mercator with an accuracy of a few nanometers,</a>
	 *    J. Geodesy 85(8), 475--485 (Aug. 2011);
	 *    preprint
	 *    <a href="https://arxiv.org/abs/1002.1417">arXiv:1002.1417</a>.
	 *
	 * Lee gives the correct results for forward and reverse transformations
	 * subject to the branch cut rules (see the description of the \e extendp
	 * argument to the constructor).  The maximum error is about 8 nm (8
	 * nanometers), ground distance, for the forward and reverse transformations.
	 * The error in the convergence is 2 &times; 10<sup>&minus;15</sup>&quot;,
	 * the relative error in the scale is 7 &times; 10<sup>&minus;12</sup>%%.
	 * See Sec. 3 of
	 * <a href="https://arxiv.org/abs/1002.1417">arXiv:1002.1417</a> for details.
	 * The method is "exact" in the sense that the errors are close to the
	 * round-off limit and that no changes are needed in the algorithms for them
	 * to be used with reals of a higher precision.  Thus the errors using long
	 * double (with a 64-bit fraction) are about 2000 times smaller than using
	 * double (with a 53-bit fraction).
	 *
	 * This algorithm is about 4.5 times slower than the 6th-order Kr&uuml;ger
	 * method, TransverseMercator, taking about 11 us for a combined forward and
	 * reverse projection on a 2.66 GHz Intel machine (g++, version 4.3.0, -O3).
	 *
	 * The ellipsoid parameters and the central scale are set in the constructor.
	 * The central meridian (which is a trivial shift of the longitude) is
	 * specified as the \e lon0 argument of the TransverseMercatorExact::Forward
	 * and TransverseMercatorExact::Reverse functions.  The latitude of origin is
	 * taken to be the equator.  See the documentation on TransverseMercator for
	 * how to include a false easting, false northing, or a latitude of origin.
	 *
	 * See <a href="https://geographiclib.sourceforge.io/tm-grid.kmz"
	 * type="application/vnd.google-earth.kmz"> tm-grid.kmz</a>, for an
	 * illustration of the transverse Mercator grid in Google Earth.
	 *
	 * This class also returns the meridian convergence \e gamma and scale \e k.
	 * The meridian convergence is the bearing of grid north (the \e y axis)
	 * measured clockwise from true north.
	 *
	 * See TransverseMercatorExact.cpp for more information on the
	 * implementation.
	 *
	 * See \ref transversemercator for a discussion of this projection.
	 *
	 * Example of use:
	 * \include example-TransverseMercatorExact.cpp
	 *
	 * <a href="TransverseMercatorProj.1.html">TransverseMercatorProj</a> is a
	 * command-line utility providing access to the functionality of
	 * TransverseMercator and TransverseMercatorExact.
	 **/
	this.zeta = function (u, snu, cnu, dnu, v, snv, cnv, dnv) {
		// Lee 54.17 but write
		// atanh(snu * dnv) = asinh(snu * dnv / sqrt(cnu^2 + _mv * snu^2 * snv^2))
		// atanh(_e * snu / dnv) = asinh(_e * snu / sqrt(_mu * cnu^2 + _mv * cnv^2))
		// Overflow value s.t. atan(overflow) = pi/2

		const overflow = 1 / (Number.EPSILON * Number.EPSILON);
		let d1 = Math.sqrt((cnu * cnu) + this._mv * (snu * snv * snu * snv));
		let d2 = Math.sqrt(this._mu * (cnu * cnu) + this._mv * (cnv * cnv));
		let t1 = (d1 !== 0 ? snu * dnv / d1 : (snu < 0 ? -overflow : overflow));
		let t2 = (d2 !== 0 ? Math.sinh(this._e * Math.asinh(this._e * snu / d2)) : (snu < 0 ? -overflow : overflow));

		// psi = asinh(t1) - asinh(t2)
		// taup = sinh(psi)
		const taup = t1 * Math.hypot(1, t2) - t2 * Math.hypot(1, t1);
		const lam = (d1 !== 0 && d2 !== 0) ? Math.atan2(dnu * snv, cnu * cnv) - this._e * Math.atan2(this._e * cnu * snv, dnu * cnv) : 0;

		return {taup: taup, lam: lam};
	};

	/*
	 *
	 */
	this.dwdzeta = function (u, snu, cnu, dnu, v, snv, cnv, dnv) {
		// Lee 54.21 but write (1 - dnu^2 * snv^2) = (cnv^2 + _mu * snu^2 * snv^2)
		// (see A+S 16.21.4)
		let d = (cnv * cnv) + this._mu * (snu * snv * snu * snv);
		d = this._mv * d * d;

		const du = cnu * dnu * dnv * ((cnv * cnv) - this._mu * (snu * snv * snu * snv)) / d;
		const dv = -snu * snv * cnv * ((dnu * dnv * dnu * dnv) + this._mu * (cnu * cnu)) / d;

		return {du: du, dv: dv};
	};

	/*
	 * Starting point for zetainv
	 */
	this.zetainv0 = function (psi, lam) {
		let retval = false;
		let u, v;

		if (psi < -this._e * Math.PI / 4 &&
			lam > (1 - 2 * this._e) * Math.PI / 2 &&
			psi < lam - (1 - this._e) * Math.PI / 2) {
			// N.B. this branch is normally not taken because psi < 0 is converted
			// psi > 0 by Forward.
			//
			// There's a log singularity at w = w0 = Eu.K() + i * Ev.K(),
			// corresponding to the south pole, where we have, approximately
			//
			//   psi = _e + i * pi/2 - _e * atanh(cos(i * (w - w0)/(1 + _mu/2)))
			//
			// Inverting this gives:
			let psix = 1 - psi / this._e;
			let lamx = (Math.PI / 2 - lam) / this._e;

			u = Math.asinh(Math.sin(lamx) / Math.hypot(Math.cos(lamx), Math.sinh(psix))) * (1 + this._mu / 2);
			v = Math.atan2(Math.cos(lamx), Math.sinh(psix)) * (1 + this._mu / 2);
			u = this._Eu.K() - u;
			v = this._Ev.K() - v;
		} else if (psi < this._e * Math.PI / 2 &&
			lam > (1 - 2 * this._e) * Math.PI / 2) {
			// At w = w0 = i * Ev.K(), we have
			//
			//     zeta = zeta0 = i * (1 - _e) * pi/2
			//     zeta' = zeta'' = 0
			//
			// including the next term in the Taylor series gives:
			//
			// zeta = zeta0 - (_mv * _e) / 3 * (w - w0)^3
			//
			// When inverting this, we map arg(w - w0) = [-90, 0] to
			// arg(zeta - zeta0) = [-90, 180]

			let dlam = lam - (1 - this._e) * Math.PI / 2;
			let rad = Math.hypot(psi, dlam);

			// atan2(dlam-psi, psi+dlam) + 45d gives arg(zeta - zeta0) in range
			// [-135, 225).  Subtracting 180 (since multiplier is negative) makes
			// range [-315, 45).  Multiplying by 1/3 (for cube root) gives range
			// [-105, 15).  In particular the range [-90, 180] in zeta space maps
			// to [-90, 0] in w space as required.
			let ang = Math.atan2(dlam - psi, psi + dlam) - 0.75 * Math.PI;

			// Error using this guess is about 0.21 * (rad/e)^(5/3)
			retval = rad < this._e * this.taytol_;
			rad = Math.cbrt(3 / (this._mv * this._e) * rad);
			ang /= 3;
			u = rad * Math.cos(ang);
			v = rad * Math.sin(ang) + this._Ev.K();
		} else {
			// Use spherical TM, Lee 12.6 -- writing atanh(sin(lam) / cosh(psi)) =
			// asinh(sin(lam) / hypot(cos(lam), sinh(psi))).  This takes care of the
			// log singularity at zeta = Eu.K() (corresponding to the north pole)

			v = Math.asinh(Math.sin(lam) / Math.hypot(Math.cos(lam), Math.sinh(psi)));
			u = Math.atan2(Math.sinh(psi), Math.cos(lam));
			// But scale to put 90,0 on the right place
			u *= this._Eu.K() / (Math.PI / 2);
			v *= this._Eu.K() / (Math.PI / 2);
		}
		return {retval: retval, u: u, v: v};
	};

	/*
	 * Invert zeta using Newton's method
	 */
	this.zetainv = function (taup, lam) {

		let psi = Math.asinh(taup);
		let scal = 1 / Math.hypot(1, taup);

		let {retval: retval, u: u, v: v} = this.zetainv0(psi, lam);
		if (retval)
			return {u: u, v: v};

		let stol2 = this.tol2_ / (Math.max(psi, 1) * Math.max(psi, 1));

		// min iterations = 2, max iterations = 6; mean = 4.0
		for (let i = 0, trip = 0; i < this.numit_; ++i) {
			const {sn: snu, cn: cnu, dn: dnu} = this._Eu.sncndn(u);
			const {sn: snv, cn: cnv, dn: dnv} = this._Ev.sncndn(v);

			let {taup: tau1, lam: lam1} = this.zeta(u, snu, cnu, dnu, v, snv, cnv, dnv);
			const {du: du1, dv: dv1} = this.dwdzeta(u, snu, cnu, dnu, v, snv, cnv, dnv);

			tau1 -= taup;
			lam1 -= lam;
			tau1 *= scal;

			const delu = tau1 * du1 - lam1 * dv1;
			const delv = tau1 * dv1 + lam1 * du1;

			u -= delu;
			v -= delv;

			if (trip)
				break;

			let delw2 = (delu * delu) + (delv * delv);
			if (!(delw2 >= stol2))
				++trip;
		}

		return {u: u, v: v};
	};

	/*
	 *
	 */
	this.sigma = function (u, snu, cnu, dnu, v, snv, cnv, dnv) {
		// Lee 55.4 writing
		// dnu^2 + dnv^2 - 1 = _mu * cnu^2 + _mv * cnv^2
		const d = this._mu * (cnu * cnu) + this._mv * (cnv * cnv);
		const xi = this._Eu.E3(snu, cnu, dnu) - this._mu * snu * cnu * dnu / d;
		const eta = v - this._Ev.E3(snv, cnv, dnv) + this._mv * snv * cnv * dnv / d;

		return {xi: xi, eta: eta};
	};

	/*
	 *
	 */
	this.dwdsigma = function(u, snu, cnu, dnu, v, snv, cnv, dnv) {
		// Reciprocal of 55.9: dw/ds = dn(w)^2/_mv, expanding complex dn(w) using
		// A+S 16.21.4
		let d = ((cnv * cnv) + this._mu * (snu * snv * snu * snv));
		d = this._mv * d * d;

		const dnr = dnu * cnv * dnv;
		const dni = -this._mu * snu * cnu * snv;

		const du = ((dnr * dnr) - (dni * dni)) / d;
		const dv = 2 * dnr * dni / d;
		return {du: du, dv: dv};
	}

	/*
	 * Starting point for sigmainv
	 */
	this.sigmainv0 = function(xi, eta) {
		let retval = false;
		let u, v;

		if (eta > 1.25 * this._Ev.KE() || (xi < -0.25 * this._Eu.E0() && xi < eta - this._Ev.KE())) {
			// sigma as a simple pole at w = w0 = Eu.K() + i * Ev.K() and sigma is approximated by
			//
			// sigma = (Eu.E() + i * Ev.KE()) + 1/(w - w0)
			const x = xi - this._Eu.E0();
			const y = eta - this._Ev.KE();
			const r2 = (x*x) + (y*y);

			u = this._Eu.K() + x / r2;
			v = this._Ev.K() - y / r2;

		} else if ((eta > 0.75 * this._Ev.KE() && xi < 0.25 * this._Eu.E0()) || eta > this._Ev.KE()) {
			// At w = w0 = i * Ev.K(), we have
			//
			//     sigma = sigma0 = i * Ev.KE()
			//     sigma' = sigma'' = 0
			//
			// including the next term in the Taylor series gives:
			//
			// sigma = sigma0 - _mv / 3 * (w - w0)^3
			//
			// When inverting this, we map arg(w - w0) = [-pi/2, -pi/6] to
			// arg(sigma - sigma0) = [-pi/2, pi/2]
			// mapping arg = [-pi/2, -pi/6] to [-pi/2, pi/2]
			const deta = eta - this._Ev.KE();
			let rad = Math.hypot(xi, deta);
			// Map the range [-90, 180] in sigma space to [-90, 0] in w space.  See
			// discussion in zetainv0 on the cut for ang.
			let ang = Math.atan2(deta - xi, xi + deta) - 0.75 * Math.PI;

			// Error using this guess is about 0.068 * rad^(5/3)
			retval = rad < 2 * this.taytol_;
			rad = Math.cbrt(3 / this._mv * rad);
			ang /= 3;

			u = rad * Math.cos(ang);
			v = rad * Math.sin(ang) + this._Ev.K0();
		} else {
			// Else use w = sigma * Eu.K/Eu.E (which is correct in the limit _e -> 0)
			u = xi * this._Eu.K() / this._Eu.E0();
			v = eta * this._Eu.K() / this._Eu.E0();
		}

		return {retval: retval, u: u, v: v};
	}

	/*
	 * Invert sigma using Newton's method
	 */
	this.sigmainv= function(xi, eta) {
		let {retval: retval, u: u, v: v} = this.sigmainv0(xi, eta);
		if (retval)
			return {u: u, v: v};

		// min iterations = 2, max iterations = 7; mean = 3.9
		for (let i = 0, trip = 0; i < this.numit_; ++i) {
			const {sn: snu, cn: cnu, dn: dnu} = this._Eu.sncndn(u);
			const {sn: snv, cn: cnv, dn: dnv} = this._Ev.sncndn(v);

			let {xi: xi1, eta: eta1} = this.sigma(u, snu, cnu, dnu, v, snv, cnv, dnv);
			const {du: du1, dv: dv1} = this.dwdsigma(u, snu, cnu, dnu, v, snv, cnv, dnv);

			xi1 -= xi;
			eta1 -= eta;

			const delu = xi1 * du1 - eta1 * dv1;
			const delv = xi1 * dv1 + eta1 * du1;

			u -= delu;
			v -= delv;

			if (trip)
				break;

			let delw2 = (delu * delu) + (delv * delv);
			if (!(delw2 >= this.tol2_))
				++trip;
		}

		return {u: u, v: v};
	}

	/*
	 *
	 */
	this.scale = function (tau, lam, snu, cnu, dnu, snv, cnv, dnv) {
		const sec2 = 1 + (tau * tau);    // sec(phi)^2

		// Lee 55.12 -- negated for our sign convention.  gamma gives the bearing
		// (clockwise from true north) of grid north
		const gamma = Math.atan2(this._mv * snu * snv * cnv, cnu * dnu * dnv);

		// Lee 55.13 with nu given by Lee 9.1 -- in sqrt change the numerator
		// from
		//
		//    (1 - snu^2 * dnv^2) to (_mv * snv^2 + cnu^2 * dnv^2)
		//
		// to maintain accuracy near phi = 90 and change the denomintor from
		//
		//    (dnu^2 + dnv^2 - 1) to (_mu * cnu^2 + _mv * cnv^2)
		//
		// to maintain accuracy near phi = 0, lam = 90 * (1 - e).  Similarly
		// rewrite sqrt term in 9.1 as
		//
		//    _mv + _mu * c^2 instead of 1 - _mu * sin(phi)^2
		const k = Math.sqrt(this._mv + this._mu / sec2) * Math.sqrt(sec2) * Math.sqrt((this._mv * (snv * snv) + (cnu * dnv * cnu * dnv)) / (this._mu * (cnu * cnu) + this._mv * (cnv * cnv)));

		return {gamma: gamma, k: k};
	};

	/**
	 * Forward projection, from geographic to transverse Mercator.
	 *
	 * @param[in] lon0 central meridian of the projection (degrees).
	 * @param[in] lat latitude of point (degrees).
	 * @param[in] lon longitude of point (degrees).
	 * @param[out] x easting of point (meters).
	 * @param[out] y northing of point (meters).
	 * @param[out] gamma meridian convergence at point (degrees).
	 * @param[out] k scale of projection at point.
	 *
	 * No false easting or northing is added. \e lat should be in the range [&minus;90&deg;, 90&deg;].
	 **/
	this.Forward = function (lat, lon, lon0) {

		if (!lon0)
			lon0 = 0;

		if (lon0)
			lon0 = this.angNormalize(lon0);

		lat = this.latFix(lat);
		{
			const {s: s, t: t} = this.angDiff(lon0, lon);
			lon = s;
		}

		// Explicitly enforce the parity
		let latsign = (!this._extendp && lat < 0) ? -1 : 1;
		let lonsign = (!this._extendp && lon < 0) ? -1 : 1;

		lon *= lonsign;
		lat *= latsign;

		const backside = !this._extendp && lon > 90;
		if (backside) {
			if (lat === 0)
				latsign = -1;
			lon = 180 - lon;
		}

		const lam = lon * this.degree();
		const tau = this.tand(lat);

		// u,v = coordinates for the Thompson TM, Lee 54
		let u, v;
		if (lat === 90) {
			u = this._Eu.K();
			v = 0;
		} else if (lat === 0 && lon === 90 * (1 - this._e)) {
			u = 0;
			v = this._Ev.K();
		} else {
			// tau = tan(phi), taup = sinh(psi)
			let {u: u2, v: v2} = this.zetainv(this.taupf(tau, this._e), lam);
			u = u2;
			v = v2;
		}

		const {sn: snu, cn: cnu, dn: dnu} = this._Eu.sncndn(u);
		const {sn: snv, cn: cnv, dn: dnv} = this._Ev.sncndn(v);
		let {xi: xi, eta: eta} = this.sigma(u, snu, cnu, dnu, v, snv, cnv, dnv);

		if (backside)
			xi = 2 * this._Eu.E0() - xi;

		const y = xi * this._a * this._k0 * latsign;
		const x = eta * this._a * this._k0 * lonsign;
		let gamma, k;

		if (lat === 90) {
			gamma = lon;
			k = 1;
		} else {
			// Recompute (tau, lam) from (u, v) to improve accuracy of Scale
			let {taup: tau, lam: lam} = this.zeta(u, snu, cnu, dnu, v, snv, cnv, dnv);
			tau = this.tauf(tau, this._e);
			let {gamma: gamma2, k: k2} = this.scale(tau, lam, snu, cnu, dnu, snv, cnv, dnv);
			gamma = gamma2 / this.degree();
			k = k2;
		}

		if (backside)
			gamma = 180 - gamma;
		gamma *= latsign * lonsign;
		k *= this._k0;

		return {x: x, y: y, gamma: gamma, k: k};
	};

	/**
	 * Reverse projection, from transverse Mercator to geographic.
	 *
	 * @param[in] lon0 central meridian of the projection (degrees).
	 * @param[in] x easting of point (meters).
	 * @param[in] y northing of point (meters).
	 * @param[out] lat latitude of point (degrees).
	 * @param[out] lon longitude of point (degrees).
	 * @param[out] gamma meridian convergence at point (degrees).
	 * @param[out] k scale of projection at point.
	 *
	 * No false easting or northing is added.  The value of \e lon returned is in the range [&minus;180&deg;, 180&deg;].
	 **/
	this.Reverse = function (x, y, lon0) {

		if (!lon0)
			lon0 = 0;

		// This undoes the steps in Forward.
		let xi = y / (this._a * this._k0);
		let eta = x / (this._a * this._k0);

		// Explicitly enforce the parity
		const latsign = !this._extendp && y < 0 ? -1 : 1;
		const lonsign = !this._extendp && x < 0 ? -1 : 1;

		xi *= latsign;
		eta *= lonsign;

		const backside = !this._extendp && xi > this._Eu.E0();
		if (backside)
			xi = 2 * this._Eu.E0() - xi;

		// u,v = coordinates for the Thompson TM, Lee 54
		let u, v;
		if (xi === 0 && eta === this._Ev.KE()) {
			u = 0;
			v = this._Ev.K();
		} else {
			let {u: u2, v: v2} = this.sigmainv(xi, eta);
			u = u2;
			v = v2;
		}

		const {sn: snu, cn: cnu, dn: dnu} = this._Eu.sncndn(u);
		const {sn: snv, cn: cnv, dn: dnv} = this._Ev.sncndn(v);

		let lat, lon, gamma, k;

		if (v !== 0 || u !== this._Eu.K()) {
			let {taup: tau, lam: lam} = this.zeta(u, snu, cnu, dnu, v, snv, cnv, dnv);
			tau = this.tauf(tau, this._e);
			let phi = Math.atan(tau);
			lat = phi / this.degree();
			lon = lam / this.degree();
			let {gamma: gamma2, k: k2} = this.scale(tau, lam, snu, cnu, dnu, snv, cnv, dnv);
			gamma = gamma2 / this.degree();
			k = k2;
		} else {
			lat = 90;
			lon = gamma = 0;
			k = 1;
		}

		if (backside)
			lon = 180 - lon;
		lon *= lonsign;
		lon = this.angNormalize(lon + this.angNormalize(lon0));
		lat *= latsign;
		if (backside)
			gamma = 180 - gamma;
		gamma *= latsign * lonsign;
		k *= this._k0;

		return {lat: lat, lon: lon, gamma: gamma, k: k};
	};

	/**
	 * Constructor for a ellipsoid with
	 *
	 * @param a equatorial radius (meters).
	 * @param f flattening of ellipsoid.
	 * @param k0 central scale factor.
	 * @param extendp use extended domain.
	 * @exception GeographicErr if \e a, \e f, or \e k0 is not positive.
	 *
	 * The transverse Mercator projection has a branch point singularity at \e
	 * lat = 0 and \e lon &minus; \e lon0 = 90 (1 &minus; \e e) or (for
	 * TransverseMercatorExact::UTM) x = 18381 km, y = 0m.  The \e extendp
	 * argument governs where the branch cut is placed.  With \e extendp =
	 * false, the "standard" convention is followed, namely the cut is placed
	 * along \e x > 18381 km, \e y = 0m.  Forward can be called with any \e lat
	 * and \e lon then produces the transformation shown in Lee, Fig 46.
	 * Reverse analytically continues this in the &plusmn; \e x direction.  As
	 * a consequence, Reverse may map multiple points to the same geographic
	 * location; for example, for TransverseMercatorExact::UTM, \e x =
	 * 22051449.037349 m, \e y = &minus;7131237.022729 m and \e x =
	 * 29735142.378357 m, \e y = 4235043.607933 m both map to \e lat =
	 * &minus;2&deg;, \e lon = 88&deg;.
	 *
	 * The method will work for all ellipsoids used in terrestrial geodesy.
	 * The method cannot be applied directly to the case of a sphere (\e f = 0)
	 * because some the constants characterizing this method diverge in that
	 * limit, and in practice, \e f should be larger than about
	 * numeric_limits<real>::epsilon().  However, TransverseMercator treats the
	 * sphere exactly.
	 **/
	{
		if (!(Number.isFinite(this._a) && this._a > 0))
			throw new Error("Equatorial radius is not positive");
		if (!(this._f > 0))
			throw new Error("Flattening is not positive");
		if (!(this._f < 1))
			throw new Error("Polar semi-axis is not positive");
		if (!(Number.isFinite(this._k0) && this._k0 > 0))
			throw new Error("Scale is not positive");
	}

}

module.exports = {
	TransverseMercator: TransverseMercator
};

if (typeof window === 'undefined') {

	let tm = new TransverseMercator();

	let retXY = tm.Forward(42, 42);
	console.log(JSON.stringify(retXY));

	let retLatLon = tm.Forward(retXY.x, retXY.y);
	console.log(JSON.stringify(retLatLon));
}
