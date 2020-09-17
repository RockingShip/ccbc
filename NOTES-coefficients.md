# Finding and using the time derivative of a bezier curve

Calculating the bezier contour uses the formula:
```
bezier(t) = A*(1-t)^3 + B*3*(1-t)^2*t + C*3*(1-t)*t^2 + D*t^3
```

Even when optimized it takes 10 multiplications and 4 additions/subtraction:
```
let t1 = 1-t;
let x = t1*t1*(A*t1 + B*3*t) + t*t*(C*3*t1 + D*t)
```

In an attempt to make it even more efficient, an alternative approach is to convert the formula into a time incremental function and loop unroll all the constants.
Given the time increment `dt`, the change to `x` is:
```
dx = bezier(t+dt)-bezier(t)
```

As `A`,`B`,`C`,`D` and `dt` are all loop unrollable constants, the equation can be rewritten to the form that requires 3 multiplications and 2 additions.
```
dx = COEF2*t*t + COEF1*t + COEF0
```

The rest of this section determines the values of `COEF2`, `COEF1`, `COEF0`.

Step 1: Expand `bezier(t+dt)-bezier(t)`
```
A*(1-t-dt)^3 + B*3*(1-t-dt)^2*(t+dt) + C*3*(1-t-dt)*(t+dt)^2 + D*(t+dt)^3 - A*(1-t)^3 - B*3*(1-t)^2*t - C*3*(1-t)*t^2 - D*t^3
```

Step 2: Expand the powers
```
A*(1-t-dt)*(1-t-dt)*(1-t-dt) + B*3*(1-t-dt)*(1-t-dt)*(t+dt) + C*3*(1-t-dt)*(t+dt)*(t+dt) + D*(t+dt)*(t+dt)*(t+dt) - A*(1-t)*(1-t)*(1-t) - B*3*(1-t)*(1-t)*t - C*3*(1-t)*t*t - D*t*t*t
```

Step 3: Solve parentheses (in smaller steps)
```
A*(1-t-dt)*(1-t-dt)*(1-t-dt) =  A*( t*t*t*(-1) + t*t*(3-3*dt) + t*(-3+6*dt-3*dt*dt) + (1 -3*dt +3*dt*dt -dt*dt*dt) )
B*3*(1-t-dt)*(1-t-dt)*(t+dt) =  B*( t*t*t*(3) + t*t*(-6 +9*dt) + t*(3 -12*dt +9*dt*dt) + (3*dt -6*dt*dt +3*dt*dt*dt) )
C*3*(1-t-dt)*(t+dt)*(t+dt)   =  C*( t*t*t*(-3) + t*t*(+3 -9*dt) + t*(6*dt -9*dt*dt) + (3*dt*dt -3*dt*dt*dt) )
D*(t+dt)*(t+dt)*(t+dt)       =  D*( t*t*t*(1) + t*t*(3*dt) + t*(3*dt*dt) + (dt*dt*dt) )
-A*(1-t)*(1-t)*(1-t)         =  A*( t*t*t*(1) + t*t*(-3) + t*(3) + (-1) )
-B*3*(1-t)*(1-t)*t           =  B*( t*t*t*(-3) + t*t*(6) + t*(-3) )
-C*3*(1-t)*t*t               =  C*( t*t*t*(3) + t*t*(-3) )
-D*t*t*t                     =  D*( t*t*t*(1) )
```

Step 4: Merge terms
```
A*( t*t*(-3*dt) + t*(6*dt-3*dt*dt) + (-3*dt +3*dt*dt -dt*dt*dt) )
B*( t*t*(+9*dt) + t*(-12*dt +9*dt*dt) + (3*dt -6*dt*dt +3*dt*dt*dt) )
C*( t*t*(-9*dt) + t*(6*dt -9*dt*dt) + (3*dt*dt -3*dt*dt*dt) )
D*( t*t*(3*dt) + t*(3*dt*dt) + (dt*dt*dt) )
```

Step 5: Regroup towards `t`
```
+t*t*(A*(-3*dt) +B*(9*dt) +C*(-9*dt) +D*(3*dt))
+t*(A*(6*dt-3*dt*dt) +B*(-12*dt +9*dt*dt) +C*(6*dt -9*dt*dt) +D*(3*dt*dt))
+(A*(-3*dt +3*dt*dt -dt*dt*dt) +B*(3*dt -6*dt*dt +3*dt*dt*dt) +C*(3*dt*dt -3*dt*dt*dt) +D*(dt*dt*dt))
```

Step 6: Resulting coefficients
```
COEF2 = A*(-3*dt) +B*(9*dt) +C*(-9*dt) +D*(3*dt)
COEF1 = A*(6*dt-3*dt*dt) +B*(-12*dt +9*dt*dt) +C*(6*dt -9*dt*dt) +D*(3*dt*dt)
COEF0 = A*(-3*dt +3*dt*dt -dt*dt*dt) +B*(3*dt -6*dt*dt +3*dt*dt*dt) +C*(3*dt*dt -3*dt*dt*dt) +D*(dt*dt*dt)
```
Determining coefficients requires 90 multiplications, 24 additions and 10 subtractions.

Sample code for verification:

```
let A = .3;
let B = .5;
let C = .2;
let D = .7;
let dt = 1/10000;

let COEF2 = A*(-3*dt) +B*(9*dt) +C*(-9*dt) +D*(3*dt);
let COEF1 = A*(6*dt-3*dt*dt) +B*(-12*dt +9*dt*dt) +C*(6*dt -9*dt*dt) +D*(3*dt*dt);
let COEF0 = A*(-3*dt +3*dt*dt -dt*dt*dt) +B*(3*dt -6*dt*dt +3*dt*dt*dt) +C*(3*dt*dt -3*dt*dt*dt) +D*(dt*dt*dt);

for (let t=0,x1=A; t<1; t+=dt) {

        // calculate as absolute
        let x2 = A*(1-t)*(1-t)*(1-t) + B*3*(1-t)*(1-t)*t + C*3*(1-t)*t*t + D*t*t*t;

        // display difference
	if (Math.abs(x1-x2) > 1e-13)
	        console.log(x2-x1);

        // calculate as relative
        x1 += COEF2*t*t + COEF1*t + COEF0;
}
```
