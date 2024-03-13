import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'



export const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string
        JWT_SECRET : string
	}, 
    Variables: {
        userId: string;
    }    
}>();


blogRouter.use("/", async (c,next) =>{
    const authHeader = c.req.header("authorization") || "";
    try{
        const user = await verify(authHeader, c.env.JWT_SECRET);
        if(user)
        {
            c.set("userId", user.id)
            await next();
        } else{
            c.status(411);
            return c.json(" Invalid Request")
        }

    }catch(e){
        c.status(411);
        console.log("Error logged",e)
        return c.text("You are nbot logged In")
    }
})

blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    try
    {
        const blogs = await prisma.blog.findMany({
            select: {
                content: true,
                title: true,
                id: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });
        return c.json({
            blogs
        })
    }catch(e){
        c.status(411);
        console.log("Error logged",e)
        return c.text("Invalid Email")
    }
})

blogRouter.get('/:id', async (c) => {
    const id = await c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  try{
    const blog = await prisma.blog.findFirst({
        where:{
            id: Number(id)
        },
        select : {
            id: true,
            title : true,
            content : true,
            author : {
                select : {
                    name : true
                }
            }
        }
      })
      return c.json({
          blog
      })
      }catch(e){
        c.status(411)
        return c.json({
            message: "Error while fecthing your things"
        })
      }
})

blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const authorId = c.get("userId")
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  try{
  const blog = await prisma.blog.create({
    data : {
        title : body.title,
        content: body.content,
        authorId: Number(authorId)
    }
    })
    return c.json({
        id : blog.id
    })
    }catch(e)
    {
        c.status(411);
        console.log("Error logged",e)
        message: "Error while fecthing your things Post"
    }
})


blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  try{
  const blog = await prisma.blog.update({
    where:{
        id: body.id
    },
    data : {
        title : body.title,
        content: body.content,
    }
    })
    return c.json({
        id : blog.id
    })
    }catch(e){
        c.status(411);
        console.log("Error logged",e)
        message: "Error while fecthing your things Put"
    }

})



