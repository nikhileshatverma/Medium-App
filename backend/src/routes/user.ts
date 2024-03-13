import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
// import { signupInput, signinInput } from '@nikbro/medium-app';
import { signupInput, signinInput } from '@nikbro/medium-app_s';

export const userRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string
        JWT_SECRET : string
	},
}>();

userRouter.post('/signup',async (c) => {
    const body = await c.req.json();
    const { success } = signupInput.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({
          message: "Inputs not correct"
      })
  }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
    try 
    {  
        const user = await prisma.user.create({
        data: {
          email : body.email,
          password : body.password,
          name : body.name
        }
      })
      const jwt = await sign({
        id: user.id
      },c.env.JWT_SECRET)
      return c.text(jwt)
    }catch(e){
      c.status(411);
      console.log("Error logged",e)
      return c.text("Invalid Email")
    }
  })
  
  
  userRouter.post('/signin', async(c) => {
    const body = await c.req.json();
    const { success } = signinInput.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({
          message: "Inputs not correct"
      })
  }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
    try 
    {  
        const user = await prisma.user.findFirst({
        where: {
          email : body.email,
          password : body.password,
        }
      })
      if(!user){
        c.status(403);
        return c.text("Invalid Credentails")
      }
      const jwt = await sign({
        id: user.id
      },c.env.JWT_SECRET)
      return c.text(jwt)
    }catch(e){
      c.status(411);
      console.log("Error logged",e)
      return c.text("Invalid Email")
    }
  })

