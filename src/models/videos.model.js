import  mongoose ,{Schema } from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile:{
            type:String,//cloudinary
            requred:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description: {
            type:String,
            required:true
        },
        duration: {
            type:Number,
            required:true
        },
        views: {
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:type
        },
        owner:{
            type:Schema.Types.OnjectId,
            ref:"User"
        }
    },{
        timestamps:true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema);